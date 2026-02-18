import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback to render instead of the default UI. */
  fallback?: ReactNode;
  /** Show a minimal inline error instead of the full-page fallback. */
  inline?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    if (this.props.inline) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-3 text-sm font-medium text-red-800">
            Something went wrong loading this section.
          </p>
          <button
            onClick={this.handleReset}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            An unexpected error occurred. You can try again or return to the
            home page.
          </p>

          {this.state.error && (
            <details className="mt-4 rounded-lg border border-gray-200 bg-white p-3 text-left">
              <summary className="cursor-pointer text-xs font-medium text-gray-400">
                Error details
              </summary>
              <pre className="mt-2 overflow-auto text-xs text-red-600">
                {this.state.error.message}
              </pre>
            </details>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Home className="h-4 w-4" />
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
