import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface JobMeta {
  starred: boolean;
  tags: string[];
}

type JobMetaMap = Record<string, JobMeta>;

const STORAGE_KEY = 'job-meta';

function getOrDefault(map: JobMetaMap, jobId: string): JobMeta {
  return map[jobId] ?? { starred: false, tags: [] };
}

export function useJobMeta() {
  const [metaMap, setMetaMap] = useLocalStorage<JobMetaMap>(STORAGE_KEY, {});

  const isStarred = useCallback(
    (jobId: string) => getOrDefault(metaMap, jobId).starred,
    [metaMap],
  );

  const toggleStar = useCallback(
    (jobId: string) => {
      setMetaMap((prev) => {
        const current = getOrDefault(prev, jobId);
        return { ...prev, [jobId]: { ...current, starred: !current.starred } };
      });
    },
    [setMetaMap],
  );

  const getTags = useCallback(
    (jobId: string) => getOrDefault(metaMap, jobId).tags,
    [metaMap],
  );

  const addTag = useCallback(
    (jobId: string, tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      setMetaMap((prev) => {
        const current = getOrDefault(prev, jobId);
        if (current.tags.includes(trimmed)) return prev;
        return { ...prev, [jobId]: { ...current, tags: [...current.tags, trimmed] } };
      });
    },
    [setMetaMap],
  );

  const removeTag = useCallback(
    (jobId: string, tag: string) => {
      setMetaMap((prev) => {
        const current = getOrDefault(prev, jobId);
        return {
          ...prev,
          [jobId]: { ...current, tags: current.tags.filter((t) => t !== tag) },
        };
      });
    },
    [setMetaMap],
  );

  /** All unique tags across every job. */
  const allTags: string[] = [
    ...new Set(Object.values(metaMap).flatMap((m) => m.tags)),
  ].sort();

  return { isStarred, toggleStar, getTags, addTag, removeTag, allTags };
}
