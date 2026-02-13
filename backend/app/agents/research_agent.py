from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from app.config import settings

competitor_research_agent = LlmAgent(
    name="CompetitorResearchAgent",
    model=settings.FAST_MODEL,
    description="Researches competitor company information using web search",
    instruction="""
You are a competitive intelligence analyst researching a competitor company.

The user will specify:
- **Competitor**: The company to research (name or URL)
- **Your Product**: The product you're selling against them

Use google_search to gather comprehensive competitor intelligence:

**RESEARCH THESE AREAS:**

1. **Company Overview**
   - Founded when, HQ location, company size
   - Funding history and investors
   - Key leadership and executives

2. **Target Market**
   - Who are their ideal customers?
   - What industries do they focus on?
   - Company size they target (SMB, Mid-market, Enterprise)

3. **Products & Pricing**
   - Main product offerings
   - Pricing tiers and models
   - Free trial or freemium options

4. **Recent News**
   - Product launches
   - Acquisitions or partnerships
   - Leadership changes

5. **Customer Sentiment**
   - Search G2, Capterra, TrustRadius reviews
   - Common complaints and praise
   - NPS or satisfaction scores if available

Be thorough and cite specific sources where possible.
""",
    tools=[google_search],
    output_key="competitor_profile",
)
