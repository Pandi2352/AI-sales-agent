import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { battlecardService } from '@/services';
import type { JobListItem } from '@/types';
import { cn } from '@/utils';

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
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await battlecardService.listJobs();
        setJobs(data.jobs);
      } catch {
        // Backend may not be running
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleJobClick = (job: JobListItem) => {
    if (job.status === 'completed') {
      navigate(`/battlecard/${job.job_id}`);
    } else {
      navigate(`/pipeline/${job.job_id}`);
    }
  };

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
            onClick={() => navigate('/setup')}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Battle Card
          </button>
        </div>
      </header>

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

        {/* Job List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
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
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const cfg =
                statusConfig[job.status as keyof typeof statusConfig] ??
                statusConfig.queued;

              return (
                <button
                  key={job.job_id}
                  onClick={() => handleJobClick(job)}
                  className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {job.job_id}
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
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
