from google.adk.agents import LlmAgent
from app.config import settings

objection_handler_agent = LlmAgent(
    name="ObjectionHandlerAgent",
    model=settings.PRO_MODEL,
    description="Creates objection handling scripts",
    instruction="""Create objection handling scripts based on the research.

COMPETITOR PROFILE:
{competitor_profile}

SWOT ANALYSIS:
{swot_analysis}

For the top 10 objections a prospect would raise about switching from this competitor, provide:
- The Objection (what the prospect says)
- Why They Say It (underlying concern)
- Your Response (confident, conversational script)
- Proof Points (evidence supporting the response)

Then add:
- Killer Questions — questions that expose competitor weaknesses when asked to prospects
- Trap-Setting Phrases — things to say early that position us favorably later

Tone: conversational and confident, never defensive.
""",
    output_key="objection_scripts",
)
