import uuid
import json
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from app.agents import root_agent, competitor_discovery_agent
from app.schemas import BattleCardRequest, BattleCardResponse

router = APIRouter(prefix="/api/battlecard", tags=["battlecard"])

# In-memory store for job results
_jobs: dict[str, dict] = {}

session_service = InMemorySessionService()


# ── Discovery Schema ────────────────────────────────────────────────


class DiscoverRequest(BaseModel):
    project_name: str
    about_project: str
    target_audience: str | None = None


class DiscoveredCompetitor(BaseModel):
    name: str
    website: str
    description: str
    why_competitor: str
    market_position: str


class DiscoverResponse(BaseModel):
    competitors: list[DiscoveredCompetitor]


# ── Discovery Endpoint ──────────────────────────────────────────────


@router.post("/discover-competitors", response_model=DiscoverResponse)
async def discover_competitors(request: DiscoverRequest):
    """Use AI to discover competitors based on the project description."""
    runner = Runner(
        agent=competitor_discovery_agent,
        app_name="ai_sales_agent_discovery",
        session_service=session_service,
    )

    user_id = f"discovery_{uuid.uuid4().hex[:8]}"
    session = await session_service.create_session(
        app_name="ai_sales_agent_discovery",
        user_id=user_id,
    )

    prompt = (
        f"Find competitors for this product:\n\n"
        f"Product Name: {request.project_name}\n"
        f"Description: {request.about_project}\n"
    )
    if request.target_audience:
        prompt += f"Target Audience: {request.target_audience}\n"

    content = types.Content(
        role="user",
        parts=[types.Part.from_text(text=prompt)],
    )

    final_text = ""
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session.id,
        new_message=content,
    ):
        if event.is_final_response():
            for part in event.content.parts:
                if hasattr(part, "text") and part.text:
                    final_text += part.text

    # Parse JSON from agent response
    try:
        # Strip markdown code fences if present
        cleaned = final_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        data = json.loads(cleaned)
        competitors = data.get("competitors", [])
        return DiscoverResponse(
            competitors=[DiscoveredCompetitor(**c) for c in competitors[:8]]
        )
    except (json.JSONDecodeError, KeyError, TypeError):
        # Fallback: return empty if parsing fails
        return DiscoverResponse(competitors=[])


# ── Pipeline Runner ─────────────────────────────────────────────────


async def _run_pipeline(job_id: str, request: BattleCardRequest) -> None:
    """Run the agent pipeline in the background."""
    try:
        _jobs[job_id]["status"] = "processing"

        runner = Runner(
            agent=root_agent,
            app_name="ai_sales_agent",
            session_service=session_service,
        )

        session = await session_service.create_session(
            app_name="ai_sales_agent",
            user_id=f"user_{job_id}",
        )

        user_message = (
            f"Create a battle card for {request.competitor}. "
            f"We sell {request.your_product}."
        )
        if request.target_audience:
            user_message += f" Our target audience is {request.target_audience}."
        if request.about_project:
            user_message += f" About our product: {request.about_project}"

        content = types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_message)],
        )

        final_response = ""
        battle_card_html = None
        infographic_base64 = None

        async for event in runner.run_async(
            user_id=f"user_{job_id}",
            session_id=session.id,
            new_message=content,
        ):
            # Track agent progress
            if event.author:
                agent_name = event.author
                stage_map = {
                    "CompetitorResearchAgent": ("research", 14),
                    "ProductFeatureAgent": ("feature_analysis", 28),
                    "PositioningAnalyzer": ("positioning_intel", 42),
                    "StrengthsWeaknessesAgent": ("swot_analysis", 57),
                    "ObjectionHandlerAgent": ("objection_scripts", 71),
                    "BattleCardGenerator": ("battle_card", 85),
                    "ComparisonChartAgent": ("comparison_chart", 100),
                }
                if agent_name in stage_map:
                    stage, progress = stage_map[agent_name]
                    _jobs[job_id]["current_stage"] = stage
                    _jobs[job_id]["progress"] = progress

            # Capture tool results from function_response parts
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if hasattr(part, "function_response") and part.function_response:
                        fn_name = part.function_response.name
                        fn_result = part.function_response.response
                        if (
                            fn_name == "generate_battle_card_html"
                            and isinstance(fn_result, dict)
                            and "html" in fn_result
                        ):
                            battle_card_html = fn_result["html"]
                        if (
                            fn_name == "generate_comparison_chart"
                            and isinstance(fn_result, dict)
                            and "image_base64" in fn_result
                        ):
                            infographic_base64 = fn_result["image_base64"]

            # Collect final text
            if event.is_final_response():
                for part in event.content.parts:
                    if hasattr(part, "text") and part.text:
                        final_response += part.text

        # Fallback: check session state for output keys
        if not battle_card_html or not infographic_base64:
            session_state = (
                await session_service.get_session(
                    app_name="ai_sales_agent",
                    user_id=f"user_{job_id}",
                    session_id=session.id,
                )
            ).state

            if not battle_card_html and "battle_card_result" in session_state:
                result = session_state["battle_card_result"]
                if isinstance(result, dict) and "html" in result:
                    battle_card_html = result["html"]

            if not infographic_base64 and "chart_result" in session_state:
                result = session_state["chart_result"]
                if isinstance(result, dict) and "image_base64" in result:
                    infographic_base64 = result["image_base64"]

        _jobs[job_id].update(
            {
                "status": "completed",
                "progress": 100,
                "current_stage": None,
                "battle_card_html": battle_card_html,
                "infographic_base64": infographic_base64,
                "raw_output": final_response,
            }
        )

    except Exception as e:
        _jobs[job_id].update(
            {
                "status": "failed",
                "error": str(e),
            }
        )


# ── Battle Card CRUD ────────────────────────────────────────────────


@router.post("/generate", response_model=BattleCardResponse)
async def generate_battle_card(request: BattleCardRequest):
    """Start the battle card generation pipeline."""
    job_id = f"bc_{uuid.uuid4().hex[:12]}"

    _jobs[job_id] = {
        "status": "queued",
        "progress": 0,
        "current_stage": None,
        "battle_card_html": None,
        "infographic_base64": None,
        "raw_output": None,
        "error": None,
    }

    asyncio.create_task(_run_pipeline(job_id, request))

    return BattleCardResponse(job_id=job_id, status="queued")


@router.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Get the current status of a pipeline job."""
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = _jobs[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "current_stage": job["current_stage"],
        "error": job.get("error"),
    }


@router.get("/result/{job_id}", response_model=BattleCardResponse)
async def get_battle_card_result(job_id: str):
    """Get the completed battle card result."""
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = _jobs[job_id]
    if job["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed yet. Current status: {job['status']}",
        )

    return BattleCardResponse(
        job_id=job_id,
        status="completed",
        battle_card_html=job["battle_card_html"],
        infographic_base64=job["infographic_base64"],
        raw_output={"final_text": job["raw_output"]},
    )


@router.get("/list")
async def list_jobs():
    """List all battle card jobs."""
    return {
        "jobs": [
            {
                "job_id": jid,
                "status": data["status"],
                "progress": data["progress"],
            }
            for jid, data in _jobs.items()
        ]
    }
