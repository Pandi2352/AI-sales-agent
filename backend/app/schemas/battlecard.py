from pydantic import BaseModel
from enum import Enum


class StageNameEnum(str, Enum):
    RESEARCH = "research"
    FEATURE_ANALYSIS = "feature_analysis"
    POSITIONING_INTEL = "positioning_intel"
    SWOT_ANALYSIS = "swot_analysis"
    OBJECTION_SCRIPTS = "objection_scripts"
    BATTLE_CARD = "battle_card"
    COMPARISON_CHART = "comparison_chart"


class TemplateEnum(str, Enum):
    SALES_REP = "sales_rep"
    EXECUTIVE = "executive"
    DETAILED = "detailed"
    SLIDE_DECK = "slide_deck"


class BattleCardRequest(BaseModel):
    competitor: str
    your_product: str
    target_audience: str | None = None
    project_name: str | None = None
    about_project: str | None = None
    template: TemplateEnum = TemplateEnum.DETAILED


class StageStatus(BaseModel):
    stage: StageNameEnum
    status: str  # "pending" | "running" | "completed" | "failed"
    summary: str | None = None


class PipelineStatus(BaseModel):
    job_id: str
    status: str  # "processing" | "completed" | "failed"
    progress: int  # 0-100
    current_stage: StageNameEnum | None = None
    stages: list[StageStatus]
    error: str | None = None


class BattleCardResponse(BaseModel):
    job_id: str
    status: str
    battle_card_html: str | None = None
    infographic_base64: str | None = None
    raw_output: dict | None = None
