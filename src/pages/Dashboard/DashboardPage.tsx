import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  LayoutDashboard,
  Columns2,
  Search,
  ArrowUpDown,
  Star,
  Tag,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { battlecardService } from '@/services';
import type { JobListItem } from '@/types';
import { cn } from '@/utils';
import { AppHeader } from '@/components/layout/AppHeader';
import { Skeleton } from '@/components/common';
import { usePageTitle, useJobMeta } from '@/hooks';

/** Format an ISO timestamp into a short relative string. */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Build a display title from job metadata. */
function jobTitle(job: JobListItem): string {
  if (job.project_name && job.competitor) {
    return `${job.project_name} vs ${job.competitor}`;
  }
  if (job.project_name) return job.project_name;
  if (job.competitor) return `vs ${job.competitor}`;
  return job.job_id;
}

const statusConfig = {
  completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: 'Completed',
    className: 'bg-green-50 text-green-700',
  },
  processing: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    label: 'Processing',
    className: 'bg-blue-50 text-blue-700',
  },
  queued: {
    icon: <Clock className="h-4 w-4" />,
    label: 'Queued',
    className: 'bg-yellow-50 text-yellow-700',
  },
  failed: {
    icon: <AlertCircle className="h-4 w-4" />,
    label: 'Failed',
    className: 'bg-red-50 text-red-700',
  },
} as const;

export function DashboardPage() {
  const navigate = useNavigate();
  usePageTitle('Dashboard');
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'processing' | 'completed' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status'>('newest');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [starredOnly, setStarredOnly] = useState(false);
  const [tagInputJobId, setTagInputJobId] = useState<string | null>(null);
  const [tagInputValue, setTagInputValue] = useState('');
  const { isStarred, toggleStar, getTags, addTag, removeTag, allTags } = useJobMeta();
  const hasShownError = useRef(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await battlecardService.listJobs();
        setJobs(data.jobs);
        hasShownError.current = false;
      } catch {
        if (!hasShownError.current) {
          toast.error('Could not load jobs. Make sure the backend is running.');
          hasShownError.current = true;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const STATUS_ORDER: Record<string, number> = { processing: 0, queued: 1, completed: 2, failed: 3 };

  const filteredJobs = useMemo(() => {
    let result = jobs;

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (j) =>
          j.job_id.toLowerCase().includes(q) ||
          (j.project_name?.toLowerCase().includes(q) ?? false) ||
          (j.competitor?.toLowerCase().includes(q) ?? false),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((j) =>
        statusFilter === 'processing'
          ? j.status === 'processing' || j.status === 'queued'
          : j.status === statusFilter,
      );
    }

    // Starred filter
    if (starredOnly) {
      result = result.filter((j) => isStarred(j.job_id));
    }

    // Tag filter
    if (tagFilter) {
      result = result.filter((j) => getTags(j.job_id).includes(tagFilter));
    }

    // Sort — starred always float to top, then apply chosen sort
    if (sortBy === 'newest') {
      result = [...result].reverse();
    } else if (sortBy === 'status') {
      result = [...result].sort(
        (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9),
      );
    } else {
      result = [...result];
    }

    // Starred items always on top
    result.sort((a, b) => {
      const aS = isStarred(a.job_id) ? 0 : 1;
      const bS = isStarred(b.job_id) ? 0 : 1;
      return aS - bS;
    });

    return result;
  }, [jobs, search, statusFilter, sortBy, starredOnly, tagFilter, isStarred, getTags]);

  const handleJobClick = (job: JobListItem) => {
    if (job.status === 'completed') {
      navigate(`/battlecard/${job.job_id}`);
    } else {
      navigate(`/pipeline/${job.job_id}`);
    }
  };

  const toggleSelect = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  const handleCompare = () => {
    const ids = Array.from(selectedJobs).join(',');
    navigate(`/compare?jobs=${ids}`);
  };

  const handleAddTag = (jobId: string) => {
    const trimmed = tagInputValue.trim();
    if (trimmed) {
      addTag(jobId, trimmed);
      toast.success(`Tag "${trimmed}" added`);
    }
    setTagInputValue('');
    setTagInputJobId(null);
  };

  const handleRemoveTag = (jobId: string, tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeTag(jobId, tag);
  };

  const handleStarClick = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStar(jobId);
  };

  const handleTagButtonClick = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTagInputJobId(tagInputJobId === jobId ? null : jobId);
    setTagInputValue('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        actions={
          <button
            onClick={() => navigate('/setup')}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Battle Card
          </button>
        }
      />

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Page Title */}
        <div className="mb-8 flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">
              All your generated battle cards in one place.
            </p>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
                <Skeleton className="mb-2 h-7 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
              <p className="text-sm text-gray-500">Total Jobs</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-2xl font-bold text-green-600">
                {jobs.filter((j) => j.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-2xl font-bold text-blue-600">
                {jobs.filter((j) => j.status === 'processing' || j.status === 'queued').length}
              </p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
          </div>
        )}

        {/* Search + Sort */}
        {!loading && jobs.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, competitor, or ID..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-4 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative shrink-0">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pr-8 pl-10 text-sm font-medium text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="status">By Status</option>
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
        )}

        {/* Status Filter Tabs */}
        {!loading && jobs.length > 0 && (
          <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
            {(
              [
                { key: 'all', label: 'All', count: jobs.length },
                {
                  key: 'processing',
                  label: 'In Progress',
                  count: jobs.filter((j) => j.status === 'processing' || j.status === 'queued').length,
                },
                {
                  key: 'completed',
                  label: 'Completed',
                  count: jobs.filter((j) => j.status === 'completed').length,
                },
                {
                  key: 'failed',
                  label: 'Failed',
                  count: jobs.filter((j) => j.status === 'failed').length,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  statusFilter === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'ml-1.5 inline-block min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-xs font-semibold',
                    statusFilter === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Starred Toggle + Tag Filter */}
        {!loading && jobs.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStarredOnly(!starredOnly)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                starredOnly
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              <Star className={cn('h-3.5 w-3.5', starredOnly && 'fill-amber-400')} />
              Starred
            </button>

            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  tagFilter === tag
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                )}
              >
                <Tag className="h-3 w-3" />
                {tag}
                {tagFilter === tag && <X className="h-3 w-3" />}
              </button>
            ))}

            {(starredOnly || tagFilter) && (
              <button
                onClick={() => { setStarredOnly(false); setTagFilter(null); }}
                className="text-xs font-medium text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Job List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5"
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="mb-2 h-4 w-48" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No battle cards yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first competitive battle card to get started.
            </p>
            <button
              onClick={() => navigate('/setup')}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create Battle Card
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <Search className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              {search.trim()
                ? 'No matching jobs'
                : statusFilter === 'completed'
                  ? 'No completed jobs'
                  : statusFilter === 'processing'
                    ? 'No jobs in progress'
                    : statusFilter === 'failed'
                      ? 'No failed jobs'
                      : 'No jobs found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {search.trim()
                ? `No jobs match "${search.trim()}". Try a different search.`
                : starredOnly
                  ? 'Star some jobs to see them here.'
                  : tagFilter
                    ? `No jobs tagged "${tagFilter}".`
                    : 'Try changing the filter or create a new battle card.'}
            </p>
            {(search.trim() || statusFilter !== 'all' || starredOnly || tagFilter) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); setStarredOnly(false); setTagFilter(null); }}
                className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const cfg =
                statusConfig[job.status as keyof typeof statusConfig] ??
                statusConfig.queued;
              const isCompleted = job.status === 'completed';
              const isSelected = selectedJobs.has(job.job_id);
              const starred = isStarred(job.job_id);
              const jobTags = getTags(job.job_id);
              const showingTagInput = tagInputJobId === job.job_id;

              return (
                <div
                  key={job.job_id}
                  className={cn(
                    'rounded-xl border bg-white transition-shadow hover:shadow-md',
                    isSelected
                      ? 'border-blue-400 ring-2 ring-blue-100'
                      : 'border-gray-200',
                  )}
                >
                  <button
                    onClick={() => handleJobClick(job)}
                    className="flex w-full items-center gap-4 p-5 text-left"
                  >
                    {/* Checkbox for completed jobs */}
                    {isCompleted && (
                      <div
                        role="checkbox"
                        aria-checked={isSelected}
                        onClick={(e) => toggleSelect(job.job_id, e)}
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 bg-white hover:border-blue-400',
                        )}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    )}

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {jobTitle(job)}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            cfg.className,
                          )}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                        {job.status === 'processing' && (
                          <span className="text-xs text-gray-500">
                            {job.progress}% complete
                          </span>
                        )}
                        {job.created_at && (
                          <span className="text-xs text-gray-400" title={new Date(job.created_at).toLocaleString()}>
                            {timeAgo(job.created_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Star + Arrow */}
                    <div
                      onClick={(e) => handleStarClick(job.job_id, e)}
                      className="shrink-0 rounded-md p-1.5 text-gray-300 hover:bg-amber-50 hover:text-amber-400"
                      title={starred ? 'Unstar' : 'Star'}
                    >
                      <Star
                        className={cn(
                          'h-4 w-4 transition-colors',
                          starred && 'fill-amber-400 text-amber-400',
                        )}
                      />
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
                  </button>

                  {/* Tags row */}
                  {(jobTags.length > 0 || showingTagInput) && (
                    <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 px-5 py-2.5">
                      {jobTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                        >
                          {tag}
                          <button
                            onClick={(e) => handleRemoveTag(job.job_id, tag, e)}
                            className="rounded-full p-0.5 hover:bg-gray-200"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))}

                      {showingTagInput && (
                        <input
                          autoFocus
                          type="text"
                          value={tagInputValue}
                          onChange={(e) => setTagInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTag(job.job_id);
                            if (e.key === 'Escape') {
                              setTagInputJobId(null);
                              setTagInputValue('');
                            }
                          }}
                          onBlur={() => {
                            if (tagInputValue.trim()) handleAddTag(job.job_id);
                            else { setTagInputJobId(null); setTagInputValue(''); }
                          }}
                          placeholder="Add tag..."
                          className="w-24 rounded-full border border-gray-200 px-2.5 py-0.5 text-xs focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      )}
                    </div>
                  )}

                  {/* Add-tag trigger (shown when no tags and input hidden) */}
                  {jobTags.length === 0 && !showingTagInput && (
                    <div className="border-t border-gray-100 px-5 py-2">
                      <button
                        onClick={(e) => handleTagButtonClick(job.job_id, e)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                      >
                        <Tag className="h-3 w-3" />
                        Add tag
                      </button>
                    </div>
                  )}

                  {/* Add more tag button when tags exist */}
                  {jobTags.length > 0 && !showingTagInput && (
                    <div className="px-5 pb-2">
                      <button
                        onClick={(e) => handleTagButtonClick(job.job_id, e)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                      >
                        <Plus className="h-3 w-3" />
                        Add tag
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating compare bar */}
      {selectedJobs.size >= 2 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-6 py-3 shadow-lg backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {selectedJobs.size}
              </span>{' '}
              battle cards selected
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedJobs(new Set())}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Clear
              </button>
              <button
                onClick={handleCompare}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Columns2 className="h-4 w-4" />
                Compare ({selectedJobs.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
