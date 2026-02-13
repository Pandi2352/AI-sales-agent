from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from app.config import settings

positioning_analyzer_agent = LlmAgent(
    name="PositioningAnalyzer",
    model=settings.PRO_MODEL,
    description="Analyzes competitor positioning and messaging",
    instruction="""
You are a marketing strategist analyzing competitor positioning.

COMPETITOR PROFILE:
{competitor_profile}

FEATURE ANALYSIS:
{feature_analysis}

Use google_search to uncover their positioning strategy:

**ANALYZE THESE AREAS:**

1. **Messaging & Taglines**
   - Their homepage headline
   - Key value propositions
   - How they describe themselves

2. **Target Personas**
   - Who do they market to?
   - Job titles mentioned in marketing
   - Use cases they highlight

3. **Competitive Positioning**
   - How do THEY position against YOUR product?
   - Comparison pages they have
   - Claims they make about competitors

4. **Analyst Coverage**
   - Gartner Magic Quadrant position
   - Forrester Wave placement
   - G2 Grid position

5. **Social Proof**
   - Customer logos they showcase
   - Case studies and testimonials
   - Awards and recognition

Identify messaging we can counter or leverage.
""",
    tools=[google_search],
    output_key="positioning_intel",
)
