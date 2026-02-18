import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Cpu,
  Target,
  Shield,
  MessageSquare,
  FileText,
  BarChart3,
  CheckCircle2,
  Loader2,
  Circle,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { battlecardService } from '@/services';
import type { PipelineStatusResponse, StageName } from '@/types';
import { cn } from '@/utils';
import { AppHeader } from '@/components/layout/AppHeader';
import { usePageTitle } from '@/hooks';

interface StageConfig {
  key: StageName;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STAGES: StageConfig[] = [
  {
    key: 'research',
    label: 'Competitor Research',
    description: 'Scanning web for company info, funding, customers, and reviews',
    icon: <Search className="h-5 w-5" />,
  },
  {
    key: 'feature_analysis',
    label: 'Feature Analysis',
    description: 'Analyzing product capabilities, integrations, and pricing',
    icon: <Cpu className="h-5 w-5" />,
  },
  {
    key: 'positioning_intel',
    label: 'Positioning Intel',
    description: 'Uncovering messaging strategy, personas, and analyst coverage',
    icon: <Target className="h-5 w-5" />,
  },
  {
    key: 'swot_analysis',
    label: 'SWOT Analysis',
    description: 'Building strengths, weaknesses, opportunities, and threats',
    icon: <Shield className="h-5 w-5" />,
  },
  {
    key: 'objection_scripts',
    label: 'Objection Scripts',
    description: 'Generating top 10 objection handling responses',
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    key: 'battle_card',
    label: 'Battle Card',
    description: 'Assembling professional HTML battle card for sales reps',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    key: 'comparison_chart',
    label: 'Comparison Chart',
    description: 'Creating AI-generated visual comparison infographic',
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

function getStageStatus(
  stageKey: StageName,
  currentStage: StageName | null,
  pipelineStatus: string,
): 'completed' | 'running' | 'pending' | 'failed' {
  if (pipelineStatus === 'failed') {
    if (currentStage === stageKey) return 'failed';
  }

  const stageIndex = STAGES.findIndex((s) => s.key === stageKey);
  const currentIndex = currentStage
    ? STAGES.findIndex((s) => s.key === currentStage)
    : -1;

  if (pipelineStatus === 'completed') return 'completed';
  if (stageIndex < currentIndex) return 'completed';
  if (stageIndex === currentIndex) return 'running';
  return 'pending';
}

export function PipelinePage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  usePageTitle('Pipeline');
  const [status, setStatus] = useState<PipelineStatusResponse | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Expandable stage panels
  const [expandedStage, setExpandedStage] = useState<StageName | null>(null);
  const [stageCache, setStageCache] = useState<Partial<Record<StageName, string>>>({});
  const [loadingStage, setLoadingStage] = useState<StageName | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const data = await battlecardService.getStatus(jobId);
        setStatus(data);

        if (data.status === 'completed') {
          toast.success('Battle card is ready!');
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else if (data.status === 'failed') {
          toast.error('Pipeline failed. See details below.');
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        toast.error('Lost connection to the server. Retrying...');
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobId]);

  const handleToggleStage = useCallback(
    async (stageKey: StageName) => {
      // Toggle off
      if (expandedStage === stageKey) {
        setExpandedStage(null);
        return;
      }

      setExpandedStage(stageKey);

      // Already cached
      if (stageCache[stageKey]) return;

      // Fetch stage result
      if (!jobId) return;
      setLoadingStage(stageKey);

      try {
        const result = await battlecardService.getStageResult(jobId, stageKey);
        setStageCache((prev) => ({ ...prev, [stageKey]: result.content }));
      } catch {
        setStageCache((prev) => ({
          ...prev,
          [stageKey]: '[Could not load stage output]',
        }));
      } finally {
        setLoadingStage(null);
      }
    },
    [expandedStage, stageCache, jobId],
  );

  const progress = status?.progress ?? 0;
  const isComplete = status?.status === 'completed';
  const isFailed = status?.status === 'failed';
  const completedStages = new Set(status?.completed_stages ?? []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        actions={
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Dashboard
          </button>
        }
      />

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            {isComplete
              ? 'PIPELINE COMPLETE'
              : isFailed
                ? 'PIPELINE FAILED'
                : 'PIPELINE RUNNING'}
          </div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {isComplete
                  ? 'Your Battle Card is Ready!'
                  : isFailed
                    ? 'Pipeline Failed'
                    : 'Generating Battle Card...'}
              </h1>
              {(status?.project_name || status?.competitor) && (
                <p className="mt-0.5 text-sm text-gray-500">
                  {status.project_name && status.competitor
                    ? `${status.project_name} vs ${status.competitor}`
                    : status.project_name || `vs ${status?.competitor}`}
                </p>
              )}
            </div>
            <span
              className={cn(
                'text-sm font-medium',
                isComplete
                  ? 'text-green-600'
                  : isFailed
                    ? 'text-red-600'
                    : 'text-blue-600',
              )}
            >
              {progress}% Complete
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-700 ease-out',
                isComplete
                  ? 'bg-green-500'
                  : isFailed
                    ? 'bg-red-500'
                    : 'bg-blue-600',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Error banner */}
        {isFailed && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {status?.error || 'An error occurred during processing.'}
              </p>
              <button
                onClick={() => navigate('/setup')}
                className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-900"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Stage List */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {STAGES.map((stage, i) => {
            const stageStatus = status
              ? getStageStatus(
                  stage.key,
                  status.current_stage,
                  status.status,
                )
              : 'pending';

            const isStageCompleted =
              stageStatus === 'completed' || completedStages.has(stage.key);
            const isExpanded = expandedStage === stage.key;
            const isLoadingThis = loadingStage === stage.key;
            const cachedContent = stageCache[stage.key];

            return (
              <div
                key={stage.key}
                className={cn(
                  i < STAGES.length - 1 && 'border-b border-gray-100',
                )}
              >
                {/* Stage Row */}
                <div
                  role={isStageCompleted ? 'button' : undefined}
                  tabIndex={isStageCompleted ? 0 : undefined}
                  onClick={() => isStageCompleted && handleToggleStage(stage.key)}
                  onKeyDown={(e) => {
                    if (isStageCompleted && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleToggleStage(stage.key);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-4 px-6 py-5',
                    isStageCompleted &&
                      'cursor-pointer transition-colors hover:bg-green-50/50',
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      stageStatus === 'completed' && 'bg-green-50 text-green-600',
                      stageStatus === 'running' && 'bg-blue-50 text-blue-600',
                      stageStatus === 'pending' && 'bg-gray-50 text-gray-400',
                      stageStatus === 'failed' && 'bg-red-50 text-red-500',
                    )}
                  >
                    {stage.icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        stageStatus === 'completed' && 'text-green-700',
                        stageStatus === 'running' && 'text-blue-700',
                        stageStatus === 'pending' && 'text-gray-500',
                        stageStatus === 'failed' && 'text-red-700',
                      )}
                    >
                      {stage.label}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {stage.description}
                    </p>
                  </div>

                  {/* Status indicator + expand chevron */}
                  <div className="flex shrink-0 items-center gap-2">
                    {stageStatus === 'completed' && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {stageStatus === 'running' && (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    )}
                    {stageStatus === 'pending' && (
                      <Circle className="h-5 w-5 text-gray-300" />
                    )}
                    {stageStatus === 'failed' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}

                    {isStageCompleted && (
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-gray-400 transition-transform duration-200',
                          isExpanded && 'rotate-180',
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* Expandable Detail Panel */}
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{
                    gridTemplateRows: isExpanded ? '1fr' : '0fr',
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-gray-100 bg-gray-50/80 px-6 py-4">
                      {isLoadingThis ? (
                        <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading stage results...
                        </div>
                      ) : cachedContent ? (
                        <div className="max-h-72 overflow-y-auto">
                          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
                            {cachedContent}
                          </pre>
                        </div>
                      ) : (
                        <p className="py-3 text-sm text-gray-400">
                          No output available for this stage.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {isComplete && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate(`/battlecard/${jobId}`)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 font-semibold text-white hover:bg-blue-700"
            >
              View Battle Card
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/setup')}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-6 py-3.5 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Generate Another
            </button>
          </div>
        )}

        {!isComplete && !isFailed && (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/setup')}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
