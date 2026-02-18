import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface AppHeaderProps {
  actions?: ReactNode;
}

export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="h-6 w-2 rounded-sm bg-blue-600" />
            <div className="h-6 w-2 rounded-sm bg-blue-600" />
            <div className="h-6 w-2 rounded-sm bg-blue-600" />
          </div>
          <span className="text-xl font-semibold text-gray-900">IntelPipeline</span>
        </Link>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
