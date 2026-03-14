from google.adk.agents import SequentialAgent, ParallelAgent, LlmAgent
from google.adk.tools import google_search
from app.config import settings
from app.tools import generate_battle_card_html, generate_comparison_chart

from .research_agent import competitor_research_agent
from .feature_agent import product_feature_agent
from .positioning_agent import positioning_analyzer_agent
from .swot_agent import swot_agent
from .objection_agent import objection_handler_agent
from .battlecard_agent import battle_card_generator_agent
from .chart_agent import comparison_chart_agent


# ── Agent factory helpers (for creating fresh instances) ──────────

def _make_swot():
    return LlmAgent(
        name="StrengthsWeaknessesAgent",
        model=settings.PRO_MODEL,
        description="Synthesizes SWOT analysis from research",
        instruction=swot_agent.instruction,
        output_key="swot_analysis",
    )

def _make_objection():
    return LlmAgent(
        name="ObjectionHandlerAgent",
        model=settings.PRO_MODEL,
        description="Creates objection handling scripts",
        instruction=objection_handler_agent.instruction,
        output_key="objection_scripts",
    )

def _make_battlecard():
    return LlmAgent(
        name="BattleCardGenerator",
        model=settings.FAST_MODEL,
        description="Generates professional HTML battle card",
        instruction=battle_card_generator_agent.instruction,
        tools=[generate_battle_card_html],
        output_key="battle_card_result",
    )

def _make_chart():
    return LlmAgent(
        name="ComparisonChartAgent",
        model=settings.FAST_MODEL,
        description="Creates visual comparison infographic using AI image generation",
        instruction=comparison_chart_agent.instruction,
        tools=[generate_comparison_chart],
        output_key="chart_result",
    )


# ── Pipelines ─────────────────────────────────────────────────────

# Phase 1: Run Research, Features, and Positioning concurrently.
parallel_research_phase = ParallelAgent(
    name="ParallelResearchPhase",
    description=(
        "Runs competitor research, feature analysis, and positioning "
        "analysis concurrently for maximum speed."
    ),
    sub_agents=[
        competitor_research_agent,      # Stage 1 — output_key: competitor_profile
        product_feature_agent,          # Stage 2 — output_key: feature_analysis
        positioning_analyzer_agent,     # Stage 3 — output_key: positioning_intel
    ],
)

# Full pipeline: parallel research → sequential synthesis.
battle_card_pipeline = SequentialAgent(
    name="BattleCardPipeline",
    description=(
        "Complete battle card pipeline: "
        "Parallel(Research + Features + Positioning) -> "
        "SWOT -> Objections -> Battle Card -> Chart"
    ),
    sub_agents=[
        parallel_research_phase,            # Stages 1-3 (parallel)
        swot_agent,                         # Stage 4
        objection_handler_agent,            # Stage 5
        battle_card_generator_agent,        # Stage 6
        comparison_chart_agent,             # Stage 7
    ],
)

# Synthesis-only pipeline: used when parallel research stages are cached.
# Uses fresh agent instances since ADK agents can only have one parent.
synthesis_only_pipeline = SequentialAgent(
    name="SynthesisOnlyPipeline",
    description=(
        "Synthesis pipeline (cache mode): "
        "SWOT -> Objections -> Battle Card -> Chart. "
        "Research data loaded from cache."
    ),
    sub_agents=[
        _make_swot(),                       # Stage 4
        _make_objection(),                  # Stage 5
        _make_battlecard(),                 # Stage 6
        _make_chart(),                      # Stage 7
    ],
)
