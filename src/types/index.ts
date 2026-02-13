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

export interface BattleCardRequest {
  competitor: string;
  your_product: string;
  target_audience?: string;
  project_name?: string;
  about_project?: string;
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
