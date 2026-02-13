from google.adk.agents import SequentialAgent
from .research_agent import competitor_research_agent
from .feature_agent import product_feature_agent
from .positioning_agent import positioning_analyzer_agent
from .swot_agent import swot_agent
from .objection_agent import objection_handler_agent
from .battlecard_agent import battle_card_generator_agent
from .chart_agent import comparison_chart_agent

battle_card_pipeline = SequentialAgent(
    name="BattleCardPipeline",
    description=(
        "Complete battle card pipeline: "
        "Research -> Features -> Positioning -> SWOT -> "
        "Objections -> Battle Card -> Chart"
    ),
    sub_agents=[
        competitor_research_agent,      # Stage 1
        product_feature_agent,          # Stage 2
        positioning_analyzer_agent,     # Stage 3
        swot_agent,                     # Stage 4
        objection_handler_agent,        # Stage 5
        battle_card_generator_agent,    # Stage 6
        comparison_chart_agent,         # Stage 7
    ],
)
