import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertIcon, RefreshIcon } from './icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 m-4">
          <div className="flex items-center gap-3 mb-4">
            <AlertIcon className="text-red-400 w-6 h-6" />
            <h3 className="text-lg font-semibold text-red-300">Something went wrong</h3>
          </div>
          
          <div className="text-red-200 mb-4">
            <p className="mb-2">An error occurred while rendering this component.</p>
            {this.state.error && (
              <details className="bg-red-900/30 p-3 rounded border border-red-700">
                <summary className="cursor-pointer text-red-300 font-medium mb-2">
                  Error Details
                </summary>
                <pre className="text-xs text-red-200 whitespace-pre-wrap overflow-auto">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </div>

          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md font-medium transition-colors"
          >
            <RefreshIcon className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;