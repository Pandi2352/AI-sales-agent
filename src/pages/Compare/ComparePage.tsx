import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Columns2 } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Skeleton } from '@/components/common';
import { useCompareData } from '@/hooks';
import { usePageTitle } from '@/hooks';
import { COMPARE_TABS } from '@/types/compare';
import type { CompareTab } from '@/types/compare';
import { cn } from '@/utils';

export function ComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<CompareTab>('overview');
  usePageTitle('Compare');

  const jobIds = useMemo(() => {
    const raw = searchParams.get('jobs') ?? '';
    return raw.split(',').filter(Boolean);
  }, [searchParams]);

  const { data, loading, error } = useCompareData(jobIds);

  const currentStage = COMPARE_TABS.find((t) => t.key === activeTab)!.stage;

  if (jobIds.length < 2) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Select at least 2 battle cards to compare
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        actions={
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Columns2 className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Compare Battle Cards
            </h1>
            <p className="text-sm text-gray-500">
              Comparing {jobIds.length} battle cards side by side.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          {COMPARE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Content Grid */}
        {loading ? (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${jobIds.length}, minmax(0, 1fr))` }}
          >
            {jobIds.map((id) => (
              <div
                key={id}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <Skeleton className="mb-4 h-5 w-32" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
          >
            {data.map((job) => (
              <div
                key={job.jobId}
                className="rounded-xl border border-gray-200 bg-white"
              >
                {/* Card header */}
                <div className="border-b border-gray-100 px-5 py-3">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {job.jobId}
                  </p>
                </div>

                {/* Card content */}
                <div className="p-5">
                  {job.stages[currentStage] ? (
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
                      {job.stages[currentStage]}
                    </div>
                  ) : (
                    <p className="text-sm italic text-gray-400">
                      No data available for this stage.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
