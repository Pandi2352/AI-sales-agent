import { Link } from 'react-router-dom';
import { Button } from '@/components/common';
import { usePageTitle } from '@/hooks';

export function NotFoundPage() {
  usePageTitle('Page Not Found');
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-8xl font-bold text-gray-200">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-900">Page Not Found</h2>
      <p className="mt-2 text-gray-600">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="mt-8">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
