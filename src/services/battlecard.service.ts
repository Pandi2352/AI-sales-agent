import { apiClient, ENDPOINTS } from '@/api';
import type {
  BattleCardRequest,
  BattleCardGenerateResponse,
  PipelineStatusResponse,
  BattleCardResult,
  JobListResponse,
  DiscoverRequest,
  DiscoverResponse,
  StageResultResponse,
} from '@/types';

export const battlecardService = {
  async generate(data: BattleCardRequest) {
    const res = await apiClient.post<BattleCardGenerateResponse>(
      ENDPOINTS.BATTLECARD.GENERATE,
      data,
    );
    return res.data;
  },

  async getStatus(jobId: string) {
    const res = await apiClient.get<PipelineStatusResponse>(
      ENDPOINTS.BATTLECARD.STATUS(jobId),
    );
    return res.data;
  },

  async getResult(jobId: string) {
    const res = await apiClient.get<BattleCardResult>(
      ENDPOINTS.BATTLECARD.RESULT(jobId),
    );
    return res.data;
  },

  async listJobs() {
    const res = await apiClient.get<JobListResponse>(ENDPOINTS.BATTLECARD.LIST);
    return res.data;
  },

  async getStageResult(jobId: string, stageName: string) {
    const res = await apiClient.get<StageResultResponse>(
      ENDPOINTS.BATTLECARD.STAGE_RESULT(jobId, stageName),
    );
    return res.data;
  },

  async discoverCompetitors(data: DiscoverRequest) {
    const res = await apiClient.post<DiscoverResponse>(
      ENDPOINTS.BATTLECARD.DISCOVER,
      data,
    );
    return res.data;
  },
};
