from google.adk.agents import LlmAgent
from app.config import settings
from app.tools import generate_battle_card_html

battle_card_generator_agent = LlmAgent(
    name="BattleCardGenerator",
    model=settings.FAST_MODEL,
    description="Generates professional HTML battle card",
    instruction="""Compile all research into a battle card using generate_battle_card_html.

COMPETITOR PROFILE:
{competitor_profile}

FEATURE ANALYSIS:
{feature_analysis}

SWOT ANALYSIS:
{swot_analysis}

OBJECTION SCRIPTS:
{objection_scripts}

Call generate_battle_card_html with these fields extracted from the data above:
- quick_stats: 1-liner key facts
- positioning_summary: how to position against them
- feature_comparison: key features, us vs. them
- their_strengths: where they beat us
- their_weaknesses: where we win
- objections_and_responses: top objections with scripted responses
- killer_questions: questions to ask prospects
- landmines: traps to set in deals
""",
    tools=[generate_battle_card_html],
    output_key="battle_card_result",
)
