from google.adk.agents import LlmAgent
from app.config import settings
from app.tools import generate_comparison_chart

comparison_chart_agent = LlmAgent(
    name="ComparisonChartAgent",
    model=settings.FAST_MODEL,
    description="Creates visual comparison infographic using AI image generation",
    instruction="""Create a comparison infographic using generate_comparison_chart.

COMPETITOR PROFILE:
{competitor_profile}

FEATURE ANALYSIS:
{feature_analysis}

SWOT ANALYSIS:
{swot_analysis}

Prepare comparison_data with:
- Overall verdict (who wins and why)
- 8-10 features scored 1-10 for both sides with winner indicated
- Top 3 differentiators where we win
- Watch areas where they have advantage
- One-line verdict summary

Call generate_comparison_chart with competitor_name, your_product_name, and comparison_data.
""",
    tools=[generate_comparison_chart],
    output_key="chart_result",
)
