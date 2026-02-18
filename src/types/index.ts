export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ── Battle Card Types ──────────────────────────────────────────────

export type StageName =
  | 'research'
  | 'feature_analysis'
  | 'positioning_intel'
  | 'swot_analysis'
  | 'objection_scripts'
  | 'battle_card'
  | 'comparison_chart';

export type TemplateName = 'sales_rep' | 'executive' | 'detailed' | 'slide_deck';

export interface BattleCardRequest {
  competitor: string;
  your_product: string;
  target_audience?: string;
  project_name?: string;
  about_project?: string;
  template?: TemplateName;
}

export interface BattleCardGenerateResponse {
  job_id: string;
  status: string;
}

export interface PipelineStatusResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  current_stage: StageName | null;
  error: string | null;
  completed_stages: StageName[];
  project_name?: string;
  competitor?: string;
  created_at?: string;
}

export interface StageResultResponse {
  stage_name: StageName;
  content: string;
}

export interface BattleCardResult {
  job_id: string;
  status: string;
  battle_card_html: string | null;
  infographic_base64: string | null;
  raw_output: Record<string, unknown> | null;
}

export interface JobListItem {
  job_id: string;
  status: string;
  progress: number;
  project_name?: string;
  competitor?: string;
  created_at?: string;
}

export interface JobListResponse {
  jobs: JobListItem[];
}

// ── Discovery Types ────────────────────────────────────────────────

export interface DiscoverRequest {
  project_name: string;
  about_project: string;
  target_audience?: string;
}

export interface DiscoveredCompetitor {
  name: string;
  website: string;
  description: string;
  why_competitor: string;
  market_position: string;
}

export interface DiscoverResponse {
  competitors: DiscoveredCompetitor[];
}

// ── Compare Types ─────────────────────────────────────────────────
export type { CompareTab, CompareJobData } from './compare';
export { COMPARE_STAGES, COMPARE_TABS } from './compare';
