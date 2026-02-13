from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from app.config import settings

product_feature_agent = LlmAgent(
    name="ProductFeatureAgent",
    model=settings.FAST_MODEL,
    description="Analyzes competitor product features and capabilities",
    instruction="""
You are a product analyst comparing competitor features.

COMPETITOR PROFILE:
{competitor_profile}

Use google_search to deeply analyze their product capabilities:

**ANALYZE THESE AREAS:**

1. **Core Features**
   - Main functionality and capabilities
   - Unique features they promote
   - What problems they solve

2. **Integrations & Ecosystem**
   - Native integrations
   - API availability
   - Marketplace/app ecosystem

3. **Technical Architecture**
   - Cloud vs. on-premise options
   - Mobile apps
   - Security certifications (SOC2, GDPR, etc.)

4. **Pricing Details**
   - Price per seat/user
   - What's included in each tier
   - Add-ons and hidden costs
   - Contract requirements

5. **Limitations**
   - Feature gaps mentioned in reviews
   - Scalability concerns
   - Known technical issues

Create a detailed feature inventory for comparison.
""",
    tools=[google_search],
    output_key="feature_analysis",
)
