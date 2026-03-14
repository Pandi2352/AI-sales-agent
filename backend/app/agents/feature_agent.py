from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from app.config import settings

product_feature_agent = LlmAgent(
    name="ProductFeatureAgent",
    model=settings.FAST_MODEL,
    description="Analyzes competitor product features and capabilities",
    instruction="""Analyze the competitor's product capabilities independently using google_search.

1. Core Features — main functionality, unique capabilities, problems solved
2. Integrations — native integrations, API availability, marketplace/ecosystem
3. Technical — cloud/on-premise, mobile apps, security certs (SOC2, GDPR)
4. Pricing — per-seat cost, tier breakdown, add-ons, hidden costs, contracts
5. Limitations — feature gaps from reviews, scalability issues, known problems

Output a detailed feature inventory.
""",
    tools=[google_search],
    output_key="feature_analysis",
)
