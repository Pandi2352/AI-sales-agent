import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/pages/Landing';
import { SetupWizard } from '@/pages/Setup';
import { PipelinePage } from '@/pages/Pipeline';
import { BattleCardPage } from '@/pages/BattleCard';
import { DashboardPage } from '@/pages/Dashboard';
import { ComparePage } from '@/pages/Compare';
import { NotFoundPage } from '@/pages/NotFound';
import { ErrorBoundary } from '@/components/common';

export const router = createBrowserRouter([
  // Landing page
  { index: true, element: <LandingPage /> },

  // App pages (standalone layouts)
  { path: 'setup', element: <SetupWizard /> },
  {
    path: 'pipeline/:jobId',
    element: (
      <ErrorBoundary>
        <PipelinePage />
      </ErrorBoundary>
    ),
  },
  {
    path: 'battlecard/:jobId',
    element: (
      <ErrorBoundary>
        <BattleCardPage />
      </ErrorBoundary>
    ),
  },
  { path: 'dashboard', element: <DashboardPage /> },
  { path: 'compare', element: <ComparePage /> },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);
