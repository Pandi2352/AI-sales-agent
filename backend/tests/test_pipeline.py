"""
Quick smoke test for imports and agent structure.

Run: python -m pytest tests/ -v
"""


def test_agents_import():
    """Verify all agents import without errors."""
    from app.agents import (
        competitor_research_agent,
        product_feature_agent,
        positioning_analyzer_agent,
        swot_agent,
        objection_handler_agent,
        battle_card_generator_agent,
        comparison_chart_agent,
        battle_card_pipeline,
        root_agent,
    )

    assert competitor_research_agent.name == "CompetitorResearchAgent"
    assert product_feature_agent.name == "ProductFeatureAgent"
    assert positioning_analyzer_agent.name == "PositioningAnalyzer"
    assert swot_agent.name == "StrengthsWeaknessesAgent"
    assert objection_handler_agent.name == "ObjectionHandlerAgent"
    assert battle_card_generator_agent.name == "BattleCardGenerator"
    assert comparison_chart_agent.name == "ComparisonChartAgent"
    assert battle_card_pipeline.name == "BattleCardPipeline"
    assert root_agent.name == "BattleCardAnalyst"


def test_pipeline_has_7_agents():
    """Verify the pipeline has all 7 sub-agents in order."""
    from app.agents import battle_card_pipeline

    assert len(battle_card_pipeline.sub_agents) == 7


def test_tools_import():
    """Verify tools import without errors."""
    from app.tools import generate_battle_card_html, generate_comparison_chart

    assert callable(generate_battle_card_html)
    assert callable(generate_comparison_chart)


def test_schemas_import():
    """Verify schemas import without errors."""
    from app.schemas import BattleCardRequest

    req = BattleCardRequest(competitor="Salesforce", your_product="HubSpot")
    assert req.competitor == "Salesforce"
    assert req.your_product == "HubSpot"
