import type { StageName } from './index';

export type CompareTab = 'overview' | 'features' | 'swot' | 'objections';

export interface CompareJobData {
  jobId: string;
  status: string;
  stages: Partial<Record<StageName, string>>;
}

export const COMPARE_STAGES: StageName[] = [
  'research',
  'feature_analysis',
  'swot_analysis',
  'objection_scripts',
];

export const COMPARE_TABS: { key: CompareTab; label: string; stage: StageName }[] = [
  { key: 'overview', label: 'Overview', stage: 'research' },
  { key: 'features', label: 'Features', stage: 'feature_analysis' },
  { key: 'swot', label: 'SWOT', stage: 'swot_analysis' },
  { key: 'objections', label: 'Objections', stage: 'objection_scripts' },
];
