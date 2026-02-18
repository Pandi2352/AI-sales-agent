import { useEffect, useState } from 'react';
import { battlecardService } from '@/services';
import { COMPARE_STAGES } from '@/types/compare';
import type { CompareJobData } from '@/types/compare';

export function useCompareData(jobIds: string[]) {
  const [data, setData] = useState<CompareJobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobIds.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          jobIds.map(async (jobId) => {
            const stageResults = await Promise.all(
              COMPARE_STAGES.map(async (stage) => {
                try {
                  const res = await battlecardService.getStageResult(jobId, stage);
                  return [stage, res.content] as const;
                } catch {
                  return [stage, ''] as const;
                }
              }),
            );

            const stages: CompareJobData['stages'] = {};
            for (const [stage, content] of stageResults) {
              stages[stage] = content;
            }

            return { jobId, status: 'completed', stages } satisfies CompareJobData;
          }),
        );

        if (!cancelled) {
          setData(results);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load comparison data. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [jobIds.join(',')]);

  return { data, loading, error };
}
