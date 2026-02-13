from google.adk.agents import LlmAgent
from app.config import settings
from app.tools import generate_battle_card_html

battle_card_generator_agent = LlmAgent(
    name="BattleCardGenerator",
    model=settings.FAST_MODEL,
    description="Generates professional HTML battle card",
    instruction="""
You create professional sales battle cards.

COMPETITOR PROFILE:
{competitor_profile}

FEATURE ANALYSIS:
{feature_analysis}

SWOT ANALYSIS:
{swot_analysis}

OBJECTION SCRIPTS:
{objection_scripts}

Use the generate_battle_card_html tool to create a professional battle card.

**PREPARE THIS DATA FOR THE TOOL:**

Compile all the research into a structured format:

1. **Quick Stats** (1-liner facts)
2. **Positioning Summary** (how to position against them)
3. **Feature Comparison** (key features, us vs. them)
4. **Their Strengths** (be honest)
5. **Their Weaknesses** (where we win)
6. **Top Objections & Responses** (quick reference)
7. **Killer Questions** (to ask prospects)
8. **Landmines** (traps to set)

Pass this compiled data to generate_battle_card_html.

The tool will create a sales-friendly HTML battle card that reps can use during calls.
""",
    tools=[generate_battle_card_html],
    output_key="battle_card_result",
)
