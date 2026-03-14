from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from app.config import settings

competitor_discovery_agent = LlmAgent(
    name="CompetitorDiscoveryAgent",
    model=settings.FAST_MODEL,
    description="Discovers competitors based on user's product description",
    instruction="""Find competitors for the user's product using google_search.

Search for: "[category] competitors", "alternatives to [similar products]", "[industry] market leaders", G2/Capterra category listings.

Return ONLY this JSON (no markdown, no extra text):

{"competitors": [{"name": "Company Name", "website": "https://example.com", "description": "What they do (under 15 words)", "why_competitor": "Why they compete", "market_position": "Leader / Challenger / Niche"}]}

Rules:
- 5-8 competitors ranked by relevance
- Only real companies with real websites
- Direct competitors only, mix of leaders and emerging players
""",
    tools=[google_search],
    output_key="discovered_competitors",
)
