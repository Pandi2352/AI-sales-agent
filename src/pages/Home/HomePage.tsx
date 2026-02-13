import { Button } from '@/components/common';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-gray-900">
        AI Sales <span className="text-primary">Agent</span>
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-gray-600">
        Supercharge your sales pipeline with intelligent automation.
        Close more deals, faster.
      </p>
      <div className="mt-8 flex gap-4">
        <Button size="lg" onClick={() => navigate(ROUTES.DASHBOARD)}>
          Get Started
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate(ROUTES.ABOUT)}>
          Learn More
        </Button>
      </div>
    </div>
  );
}
