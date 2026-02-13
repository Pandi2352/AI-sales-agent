import { useEffect, useState, useRef } from 'react';
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
} from 'lucide-react';
import { battlecardService } from '@/services';
import type { PipelineStatusResponse, StageName } from '@/types';
import { cn } from '@/utils';

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
  const [status, setStatus] = useState<PipelineStatusResponse | null>(null);
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const data = await battlecardService.getStatus(jobId);
        setStatus(data);

        if (data.status === 'completed' || data.status === 'failed') {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        setError('Lost connection to the server.');
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobId]);

  const progress = status?.progress ?? 0;
  const isComplete = status?.status === 'completed';
  const isFailed = status?.status === 'failed';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="h-6 w-2 rounded-sm bg-blue-600" />
              <div className="h-6 w-2 rounded-sm bg-blue-600" />
              <div className="h-6 w-2 rounded-sm bg-blue-600" />
            </div>
            <span className="text-xl font-semibold text-gray-900">IntelPipeline</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            {isComplete ? 'PIPELINE COMPLETE' : isFailed ? 'PIPELINE FAILED' : 'PIPELINE RUNNING'}
          </div>
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              {isComplete
                ? 'Your Battle Card is Ready!'
                : isFailed
                  ? 'Pipeline Failed'
                  : 'Generating Battle Card...'}
            </h1>
            <span
              className={cn(
                'text-sm font-medium',
                isComplete ? 'text-green-600' : isFailed ? 'text-red-600' : 'text-blue-600',
              )}
            >
              {progress}% Complete
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-700 ease-out',
                isComplete ? 'bg-green-500' : isFailed ? 'bg-red-500' : 'bg-blue-600',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Error banner */}
        {(error || isFailed) && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {error || status?.error || 'An error occurred during processing.'}
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
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {STAGES.map((stage, i) => {
            const stageStatus = status
              ? getStageStatus(stage.key, status.current_stage, status.status)
              : 'pending';

            return (
              <div
                key={stage.key}
                className={cn(
                  'flex items-center gap-4 px-6 py-5',
                  i < STAGES.length - 1 && 'border-b border-gray-100',
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
                  <p className="mt-0.5 text-xs text-gray-500">{stage.description}</p>
                </div>

                {/* Status indicator */}
                <div className="shrink-0">
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
