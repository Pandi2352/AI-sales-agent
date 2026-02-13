import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/pages/Landing';
import { SetupWizard } from '@/pages/Setup';
import { PipelinePage } from '@/pages/Pipeline';
import { BattleCardPage } from '@/pages/BattleCard';
import { DashboardPage } from '@/pages/Dashboard';
import { NotFoundPage } from '@/pages/NotFound';

export const router = createBrowserRouter([
  // Landing page
  { index: true, element: <LandingPage /> },

  // App pages (standalone layouts)
  { path: 'setup', element: <SetupWizard /> },
  { path: 'pipeline/:jobId', element: <PipelinePage /> },
  { path: 'battlecard/:jobId', element: <BattleCardPage /> },
  { path: 'dashboard', element: <DashboardPage /> },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);
