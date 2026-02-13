import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
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
  X,
} from 'lucide-react';
import { battlecardService } from '@/services';
import type { DiscoveredCompetitor } from '@/types';

export function SetupWizard() {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [aboutProject, setAboutProject] = useState('');
  const [competitor, setCompetitor] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Discovery state
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredCompetitors, setDiscoveredCompetitors] = useState<DiscoveredCompetitor[]>([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState<DiscoveredCompetitor | null>(null);
  const [showDiscovery, setShowDiscovery] = useState(false);

  const handleDiscover = async () => {
    if (!projectName.trim()) {
      setError('Project name is required for AI discovery.');
      return;
    }
    if (!aboutProject.trim()) {
      setError('Please describe your project so AI can find relevant competitors.');
      return;
    }

    setError('');
    setIsDiscovering(true);
    setShowDiscovery(true);
    setDiscoveredCompetitors([]);
    setSelectedCompetitor(null);

    try {
      const response = await battlecardService.discoverCompetitors({
        project_name: projectName,
        about_project: aboutProject,
        target_audience: targetAudience || undefined,
      });
      setDiscoveredCompetitors(response.competitors);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to discover competitors. Make sure the backend is running.',
      );
      setShowDiscovery(false);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSelectCompetitor = (comp: DiscoveredCompetitor) => {
    setSelectedCompetitor(comp);
    setCompetitor(comp.name);
  };

  const handleStartPipeline = async () => {
    if (!projectName.trim()) {
      setError('Project name is required.');
      return;
    }

    // If no competitor entered and no discovery done yet, trigger discovery
    if (!competitor.trim() && !showDiscovery) {
      handleDiscover();
      return;
    }

    // If discovery is shown but nothing selected, prompt user
    if (showDiscovery && !selectedCompetitor && !competitor.trim()) {
      setError('Please select a competitor from the discovered list or type one manually.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await battlecardService.generate({
        competitor: competitor || projectName,
        your_product: projectName,
        target_audience: targetAudience || undefined,
        project_name: projectName,
        about_project: aboutProject || undefined,
      });

      navigate(`/pipeline/${response.job_id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to start pipeline. Make sure the backend is running.',
      );
      setIsLoading(false);
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
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">Alex Johnson</div>
              <div className="text-xs text-gray-500">Admin Account</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-200 to-orange-300">
              <span className="text-sm font-medium text-orange-700">AJ</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            SETUP WIZARD
          </div>
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              Step 1: Project Configuration
            </h1>
            <span className="text-sm font-medium text-blue-600">25% Complete</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-blue-600"
              style={{ width: '25%' }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Title Section */}
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">
              Set Up Your Intelligence Pipeline
            </h2>
            <p className="text-gray-600">
              Provide a few details to help our AI tailor the competitive insights
              for your project.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Project Name */}
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
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Q4 Market Expansion"
                  className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-11 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* About My Project */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                About My Project
                <Info className="h-4 w-4 text-gray-400" />
              </label>
              <textarea
                value={aboutProject}
                onChange={(e) => setAboutProject(e.target.value)}
                placeholder="Describe the core mission, goals, and unique selling points of your project..."
                rows={5}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Primary Competitor */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  Primary Competitor (Optional)
                  <Info className="h-4 w-4 text-gray-400" />
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={competitor}
                    onChange={(e) => setCompetitor(e.target.value)}
                    placeholder="Enter name or leave blank"
                    className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-11 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDiscover}
                    disabled={isDiscovering || !projectName.trim()}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDiscovering ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {isDiscovering ? 'Scanning the web...' : 'AI Auto-Discover Competitors'}
                  </button>
                </div>
              </div>

              {/* Target Audience */}
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
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. SMB Owners, Gen Z"
                    className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-11 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* AI Discovery Results */}
            {showDiscovery && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      AI-Discovered Competitors
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDiscovery(false);
                      setDiscoveredCompetitors([]);
                      setSelectedCompetitor(null);
                      if (selectedCompetitor) setCompetitor('');
                    }}
                    className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
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
                        Our AI is searching 200+ data sources to find your top competitors
                      </p>
                    </div>
                  </div>
                ) : discoveredCompetitors.length > 0 ? (
                  <>
                    <p className="mb-3 text-xs text-gray-600">
                      Select a competitor to generate a battle card against:
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {discoveredCompetitors.map((comp) => {
                        const isSelected = selectedCompetitor?.name === comp.name;
                        return (
                          <button
                            key={comp.name}
                            type="button"
                            onClick={() => handleSelectCompetitor(comp)}
                            className={`group relative rounded-lg border p-3 text-left transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-blue-600" />
                            )}
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                  isSelected
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500'
                                }`}
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
                                  className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    comp.market_position === 'Leader'
                                      ? 'bg-amber-100 text-amber-700'
                                      : comp.market_position === 'Challenger'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-gray-100 text-gray-600'
                                  }`}
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

            {/* Start Button */}
            <button
              onClick={handleStartPipeline}
              disabled={isLoading || isDiscovering}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Starting Pipeline...
                </>
              ) : !competitor.trim() && !showDiscovery ? (
                <>
                  <Sparkles className="h-5 w-5" />
                  Discover Competitors & Start
                </>
              ) : (
                <>
                  Start AI Pipeline
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            {/* Footer Note */}
            <p className="text-center text-xs text-gray-600">
              By starting the pipeline, our AI will begin scanning 200+ data sources
              based on your inputs.
            </p>
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
