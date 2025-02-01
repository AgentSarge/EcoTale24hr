import { Component, ErrorInfo, ReactNode } from 'react';
import { monitoring } from '../../lib/monitoring';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    monitoring.captureException(error, {
      component: 'ErrorBoundary',
      errorMessage: error.message,
      errorStack: error.stack || 'No stack trace',
      componentStackSummary: errorInfo.componentStack
        ?.split('\n')
        .slice(0, 3)
        .join(' > ')
        .substring(0, 200) || 'No component stack',
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-red-50">
          <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
            <h1 className="mb-4 text-2xl font-bold text-red-600">Something went wrong</h1>
            <p className="mb-4 text-gray-600">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 