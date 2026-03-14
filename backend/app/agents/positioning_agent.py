from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from app.config import settings

positioning_analyzer_agent = LlmAgent(
    name="PositioningAnalyzer",
    model=settings.PRO_MODEL,
    description="Analyzes competitor positioning and messaging",
    instruction="""Analyze the competitor's positioning strategy independently using google_search.

1. Messaging — homepage headline, key value props, how they describe themselves
2. Target Personas — marketed job titles, highlighted use cases
3. Competitive Claims — how they position against YOUR product, comparison pages
4. Analyst Coverage — Gartner/Forrester/G2 positioning
5. Social Proof — customer logos, case studies, testimonials, awards

Identify messaging we can counter or leverage.
""",
    tools=[google_search],
    output_key="positioning_intel",
)
