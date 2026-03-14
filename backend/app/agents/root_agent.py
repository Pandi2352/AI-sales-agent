from google.adk.agents import LlmAgent
from app.config import settings
from .pipeline import battle_card_pipeline

_ROOT_INSTRUCTION = """Competitive intelligence analyst. You need two inputs:
1. Competitor (company name or URL)
2. Your Product (what the user sells)

When both are provided: transfer to the pipeline agent immediately.
If only competitor given: ask "What product are you selling against [Competitor]?"
If only product given: ask "Which competitor would you like to analyze?"
General questions: answer briefly about competitive selling or battle cards.
"""


def _build_root_agent(pipeline_agent) -> LlmAgent:
    """Build a root agent wired to the given pipeline sub-agent."""
    return LlmAgent(
        name="BattleCardAnalyst",
        model=settings.FAST_MODEL,
        description="AI-powered competitive intelligence analyst for sales teams",
        instruction=_ROOT_INSTRUCTION,
        sub_agents=[pipeline_agent],
    )


# Default root agent (full pipeline with parallel research)
root_agent = _build_root_agent(battle_card_pipeline)
