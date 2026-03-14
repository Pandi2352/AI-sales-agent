import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Info,
  Briefcase,
  Shield,
  Users,
  HelpCircle,
  ChevronLeft,
  Loader2,
  Search,
  Globe,
  CheckCircle2,
  Sparkles,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { battlecardService } from '@/services';
import type { DiscoveredCompetitor, TemplateName } from '@/types';
import { AppHeader } from '@/components/layout/AppHeader';
import { usePageTitle } from '@/hooks';
import { cn } from '@/utils';
import { StepIndicator } from './StepIndicator';

// ── Wizard State ─────────────────────────────────────────────────────

const STORAGE_KEY = 'setup-wizard';

interface WizardData {
  step: number;
  projectName: string;
  aboutProject: string;
  competitor: string;
  targetAudience: string;
  template: TemplateName;
  forceRefresh: boolean;
  discoveredCompetitors: DiscoveredCompetitor[];
  selectedCompetitorName: string | null;
}

const INITIAL_STATE: WizardData = {
  step: 0,
  projectName: '',
  aboutProject: '',
  competitor: '',
  targetAudience: '',
  template: 'detailed',
  forceRefresh: false,
  discoveredCompetitors: [],
  selectedCompetitorName: null,
};

function loadState(): WizardData {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed.step === 'number' &&
        typeof parsed.projectName === 'string'
      ) {
        return { ...INITIAL_STATE, ...parsed };
      }
    }
  } catch {
    /* corrupted data — start fresh */
  }
  return { ...INITIAL_STATE };
}

function saveState(data: WizardData) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearState() {
  sessionStorage.removeItem(STORAGE_KEY);
}

// ── Constants ────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Project Info' },
  { label: 'Competitor' },
  { label: 'Audience' },
  { label: 'Review' },
];

const STEP_TITLES = [
  'Tell Us About Your Project',
  'Choose a Competitor',
  'Audience & Options',
  'Review & Launch',
];

const STEP_DESCRIPTIONS = [
  'Provide basic details so our AI can tailor competitive insights.',
  'Select or discover a competitor to analyze.',
  'Fine-tune your battle card with audience targeting and format.',
  'Review your configuration and start the AI pipeline.',
];

const TEMPLATES: { id: TemplateName; label: string; description: string }[] = [
  {
    id: 'sales_rep',
    label: 'Sales Rep Quick Card',
    description: '1-page summary with key talking points and objection handlers',
  },
  {
    id: 'executive',
    label: 'Executive Summary',
    description: 'High-level strategic overview for leadership and stakeholders',
  },
  {
    id: 'detailed',
    label: 'Detailed Analysis',
    description: 'Full 7-section report — research, features, SWOT, and more (default)',
  },
  {
    id: 'slide_deck',
    label: 'Slide Deck Format',
    description: 'Structured for copy-pasting into presentation slides',
  },
];

// ── Main Component ───────────────────────────────────────────────────

export function SetupWizard() {
  const navigate = useNavigate();
  const [data, setData] = useState<WizardData>(loadState);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const stepNames = ['Project Info', 'Competitor', 'Audience', 'Review'];
  usePageTitle(`Setup — ${stepNames[data.step]}`);

  // Persist on every data change
  useEffect(() => {
    saveState(data);
  }, [data]);

  const update = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
    setError('');
  }, []);

  const goTo = useCallback((step: number) => {
    setData((prev) => ({ ...prev, step }));
    setError('');
  }, []);

  const progress = Math.round((data.step / (STEPS.length - 1)) * 100);

  // ── Step Validation ──────────────────────────────────────────────

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!data.projectName.trim()) {
          setError('Project name is required.');
          return false;
        }
        return true;
      case 1:
        if (!data.competitor.trim()) {
          setError(
            'Please enter a competitor name or use AI discovery to find one.',
          );
          return false;
        }
        return true;
      case 2:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(data.step)) return;
    goTo(data.step + 1);
  };

  const handleBack = () => {
    if (data.step > 0) goTo(data.step - 1);
  };

  const handleStepClick = (step: number) => {
    if (step < data.step) goTo(step);
  };

  // ── AI Discovery ─────────────────────────────────────────────────

  const handleDiscover = async () => {
    if (!data.projectName.trim()) {
      setError('Project name is required for AI discovery.');
      return;
    }
    if (!data.aboutProject.trim()) {
      setError(
        'Please go back to Step 1 and describe your project so AI can find relevant competitors.',
      );
      return;
    }

    setError('');
    setIsDiscovering(true);
    update({ discoveredCompetitors: [], selectedCompetitorName: null });

    try {
      const response = await battlecardService.discoverCompetitors({
        project_name: data.projectName,
        about_project: data.aboutProject,
        target_audience: data.targetAudience || undefined,
      });
      update({ discoveredCompetitors: response.competitors });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Failed to discover competitors. Make sure the backend is running.',
      );
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSelectCompetitor = (comp: DiscoveredCompetitor) => {
    update({ competitor: comp.name, selectedCompetitorName: comp.name });
  };

  // ── Launch Pipeline ──────────────────────────────────────────────

  const handleStartPipeline = async () => {
    setIsLoading(true);

    try {
      const response = await battlecardService.generate({
        competitor: data.competitor,
        your_product: data.projectName,
        target_audience: data.targetAudience || undefined,
        project_name: data.projectName,
        about_project: data.aboutProject || undefined,
        template: data.template,
        force_refresh: data.forceRefresh || undefined,
      });

      clearState();
      toast.success('Pipeline started successfully!');
      navigate(`/pipeline/${response.job_id}`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Failed to start pipeline. Make sure the backend is running.',
      );
      setIsLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────

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
        {/* Step Indicator */}
        <div className="mb-10">
          <StepIndicator
            steps={STEPS}
            currentStep={data.step}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Progress Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              {STEP_TITLES[data.step]}
            </h1>
            <span className="text-sm font-medium text-blue-600">
              {progress}% Complete
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {STEP_DESCRIPTIONS[data.step]}
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step Content */}
          {data.step === 0 && (
            <StepProjectInfo
              projectName={data.projectName}
              aboutProject={data.aboutProject}
              onChange={update}
            />
          )}

          {data.step === 1 && (
            <StepCompetitor
              data={data}
              isDiscovering={isDiscovering}
              onChange={update}
              onDiscover={handleDiscover}
              onSelect={handleSelectCompetitor}
            />
          )}

          {data.step === 2 && (
            <StepAudience
              targetAudience={data.targetAudience}
              template={data.template}
              onChange={update}
            />
          )}

          {data.step === 3 && <StepReview data={data} onEdit={goTo} onChange={update} />}

          {/* Navigation */}
          <div className="mt-8 flex items-center gap-3">
            {data.step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}

            <div className="flex-1" />

            {data.step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartPipeline}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting Pipeline...
                  </>
                ) : (
                  <>
                    Start AI Pipeline
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bottom Links */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <HelpCircle className="h-4 w-4" />
            Need help?
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Project Info ─────────────────────────────────────────────

function StepProjectInfo({
  projectName,
  aboutProject,
  onChange,
}: {
  projectName: string;
  aboutProject: string;
  onChange: (partial: Partial<WizardData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          Project Name
          <span className="text-red-500">*</span>
          <Info className="h-4 w-4 text-gray-400" />
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Briefcase className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onChange({ projectName: e.target.value })}
            placeholder="e.g. Q4 Market Expansion"
            className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-11 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          About My Project
          <Info className="h-4 w-4 text-gray-400" />
        </label>
        <textarea
          value={aboutProject}
          onChange={(e) => onChange({ aboutProject: e.target.value })}
          placeholder="Describe the core mission, goals, and unique selling points of your project..."
          rows={5}
          className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          A good description helps AI discover better competitors in Step 2.
        </p>
      </div>
    </div>
  );
}

// ── Step 2: Competitor Selection ─────────────────────────────────────

function StepCompetitor({
  data,
  isDiscovering,
  onChange,
  onDiscover,
  onSelect,
}: {
  data: WizardData;
  isDiscovering: boolean;
  onChange: (partial: Partial<WizardData>) => void;
  onDiscover: () => void;
  onSelect: (comp: DiscoveredCompetitor) => void;
}) {
  const hasResults =
    data.discoveredCompetitors.length > 0 || isDiscovering;

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          Primary Competitor
          <span className="text-red-500">*</span>
          <Info className="h-4 w-4 text-gray-400" />
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Shield className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={data.competitor}
            onChange={(e) =>
              onChange({ competitor: e.target.value, selectedCompetitorName: null })
            }
            placeholder="Enter competitor name"
            className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-11 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onDiscover}
            disabled={isDiscovering || !data.projectName.trim()}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDiscovering ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isDiscovering
              ? 'Scanning the web...'
              : 'AI Auto-Discover Competitors'}
          </button>
          <span className="text-xs text-gray-400">or type manually above</span>
        </div>
      </div>

      {/* Discovery Results */}
      {hasResults && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              AI-Discovered Competitors
            </h3>
          </div>

          {isDiscovering ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-blue-200" />
                <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-blue-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  Scanning the web for competitors...
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Our AI is searching 200+ data sources to find your top
                  competitors
                </p>
              </div>
            </div>
          ) : data.discoveredCompetitors.length > 0 ? (
            <>
              <p className="mb-3 text-xs text-gray-600">
                Select a competitor to generate a battle card against:
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.discoveredCompetitors.map((comp) => {
                  const isSelected =
                    data.selectedCompetitorName === comp.name;

                  return (
                    <button
                      key={comp.name}
                      type="button"
                      onClick={() => onSelect(comp)}
                      className={cn(
                        'group relative rounded-lg border p-3 text-left transition-all',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm',
                      )}
                    >
                      {isSelected && (
                        <CheckCircle2 className="absolute right-2 top-2 h-5 w-5 text-blue-600" />
                      )}
                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            isSelected
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500',
                          )}
                        >
                          <Globe className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {comp.name}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                            {comp.description}
                          </p>
                          <span
                            className={cn(
                              'mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium',
                              comp.market_position === 'Leader'
                                ? 'bg-amber-100 text-amber-700'
                                : comp.market_position === 'Challenger'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-600',
                            )}
                          >
                            {comp.market_position}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="py-4 text-center text-sm text-gray-500">
              No competitors found. Try adding more details about your project.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Audience & Options ───────────────────────────────────────

function StepAudience({
  targetAudience,
  template,
  onChange,
}: {
  targetAudience: string;
  template: TemplateName;
  onChange: (partial: Partial<WizardData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          Target Audience
          <Info className="h-4 w-4 text-gray-400" />
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => onChange({ targetAudience: e.target.value })}
            placeholder="e.g. SMB Owners, Enterprise CTOs, Gen Z Consumers"
            className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-11 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Optional. Helps AI tailor language and focus areas for the battle card.
        </p>
      </div>

      <div>
        <label className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          Battle Card Template
          <Info className="h-4 w-4 text-gray-400" />
        </label>
        <div className="space-y-2">
          {TEMPLATES.map((t) => (
            <label
              key={t.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all',
                template === t.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                  : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50',
              )}
            >
              <input
                type="radio"
                name="template"
                value={t.id}
                checked={template === t.id}
                onChange={() => onChange({ template: t.id })}
                className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {t.label}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {t.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Review & Launch ──────────────────────────────────────────

function StepReview({
  data,
  onEdit,
  onChange,
}: {
  data: WizardData;
  onEdit: (step: number) => void;
  onChange: (partial: Partial<WizardData>) => void;
}) {
  const templateLabel =
    TEMPLATES.find((t) => t.id === data.template)?.label ??
    'Standard Battle Card';

  const rows = [
    { label: 'Project Name', value: data.projectName, step: 0 },
    { label: 'About', value: data.aboutProject || '—', step: 0 },
    { label: 'Competitor', value: data.competitor, step: 1 },
    { label: 'Target Audience', value: data.targetAudience || '—', step: 2 },
    { label: 'Template', value: templateLabel, step: 2 },
  ];

  return (
    <div className="space-y-4">
      <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {row.label}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                {row.value}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEdit(row.step)}
              className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title={`Edit ${row.label}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Force Refresh Toggle */}
      <label
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all',
          data.forceRefresh
            ? 'border-amber-300 bg-amber-50'
            : 'border-gray-200 hover:border-gray-300',
        )}
      >
        <input
          type="checkbox"
          checked={data.forceRefresh}
          onChange={(e) => onChange({ forceRefresh: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
        />
        <RefreshCw
          className={cn(
            'h-4 w-4 shrink-0',
            data.forceRefresh ? 'text-amber-600' : 'text-gray-400',
          )}
        />
        <div>
          <p className="text-sm font-medium text-gray-900">Force Fresh Research</p>
          <p className="text-xs text-gray-500">
            Skip cached data and re-run all research agents from scratch.
            Use this if the competitor has recently changed their product or pricing.
          </p>
        </div>
      </label>

      <p className="text-center text-xs text-gray-500">
        By starting the pipeline, our AI will begin scanning 200+ data sources
        based on your inputs.
      </p>
    </div>
  );
}
