from google.adk.agents import LlmAgent
from app.config import settings

swot_agent = LlmAgent(
    name="StrengthsWeaknessesAgent",
    model=settings.PRO_MODEL,
    description="Synthesizes SWOT analysis from research",
    instruction="""Synthesize a SWOT analysis from the research data below.

COMPETITOR PROFILE:
{competitor_profile}

FEATURE ANALYSIS:
{feature_analysis}

POSITIONING INTEL:
{positioning_intel}

Output these four sections:

1. Their Strengths — 5 genuine strengths with evidence. Where they beat us.
2. Their Weaknesses — 5 genuine weaknesses with evidence. Where we win.
3. Our Advantages — where our product wins on features, pricing, or experience.
4. Competitive Landmines — questions to ask prospects that expose their weaknesses; topics that favor us.

Be honest. Sales reps lose credibility overstating advantages.
""",
    output_key="swot_analysis",
)
