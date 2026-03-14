from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from app.config import settings

competitor_research_agent = LlmAgent(
    name="CompetitorResearchAgent",
    model=settings.FAST_MODEL,
    description="Researches competitor company information using web search",
    instruction="""Research the competitor specified by the user. Use google_search to gather:

1. Company Overview — founding date, HQ, size, funding, key executives
2. Target Market — ideal customers, industries, company size (SMB/Mid/Enterprise)
3. Products & Pricing — main offerings, pricing tiers, free/freemium options
4. Recent News — product launches, acquisitions, partnerships, leadership changes
5. Customer Sentiment — G2/Capterra/TrustRadius reviews, common praise and complaints

Cite sources where possible. Output a structured competitor profile.
""",
    tools=[google_search],
    output_key="competitor_profile",
)
