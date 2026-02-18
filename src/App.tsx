import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from '@/routes';
import { ErrorBoundary } from '@/components/common';

export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors closeButton />
    </ErrorBoundary>
  );
}
