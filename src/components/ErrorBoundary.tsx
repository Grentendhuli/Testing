import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MessageSquare, Terminal } from 'lucide-react';
import { Button } from './Button';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    // Generate unique error ID
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.setState({ errorInfo, errorId });

    // Send to Sentry
    Sentry.withScope((scope) => {
      scope.setExtras({
        errorId,
        componentStack: errorInfo.componentStack,
      });
      Sentry.captureException(error);
    });

    // Log error to console for debugging
    console.error(`Error ID: ${errorId}`);
    console.error('Component Stack:', errorInfo.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    const { error, errorId } = this.state;
    const subject = `Bug Report: Error ${errorId || 'Unknown'}`;
    const body = `Error ID: ${errorId || 'Unknown'}

Message: ${error?.message || 'No message'}

Stack Trace:
\`\`\`
${error?.stack || 'No stack trace'}
\`\`\`

Please describe what you were doing when this error occurred:

[Your description here]`;

    window.location.href = `mailto:support@landlordbot.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    const { hasError, error, errorInfo, showDetails, errorId } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    // Custom fallback if provided
    if (fallback) {
      return fallback;
    }

    return (
      <div className="min-h-screen bg-lb-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-lb-surface border border-lb-border rounded-2xl p-8 shadow-2xl">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-lb-text-primary text-center mb-2">
            Something went wrong
          </h1>
          <p className="text-lb-text-secondary text-center mb-6">
            We apologize for the inconvenience. Our team has been notified.
          </p>

          {/* Error ID */}
          {errorId && (
            <div className="bg-lb-muted rounded-lg p-3 mb-6 text-center">
              <p className="text-xs text-lb-text-muted uppercase tracking-wider mb-1">
                Error Reference
              </p>
              <p className="font-mono text-sm text-lb-text-primary select-all">
                {errorId}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={this.handleReload}
              className="w-full gap-2"
              size="lg"
            >
              <RefreshCw className="w-5 h-5" />
              Reload Application
            </Button>

            <div className="flex gap-3">
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1"
              >
                Go Home
              </Button>
              <Button
                onClick={this.handleReportError}
                variant="outline"
                className="flex-1 gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Report Bug
              </Button>
            </div>
          </div>

          {/* Technical Details Toggle */}
          <button
            onClick={this.toggleDetails}
            className="mt-6 flex items-center justify-center gap-2 text-sm text-lb-text-muted hover:text-lb-text-secondary transition-colors w-full"
          >
            <Terminal className="w-4 h-4" />
            {showDetails ? 'Hide' : 'Show'} Technical Details
          </button>

          {/* Technical Details */}
          {showDetails && (
            <div className="mt-4 bg-lb-muted rounded-lg p-4 overflow-auto">
              <p className="text-sm font-semibold text-lb-text-secondary mb-2">
                Error Message:
              </p>
              <pre className="text-xs font-mono text-red-400 whitespace-pre-wrap break-words mb-4">
                {error?.message || 'No message available'}
              </pre>

              <p className="text-sm font-semibold text-lb-text-secondary mb-2">
                Stack Trace:
              </p>
              <pre className="text-xs font-mono text-lb-text-muted whitespace-pre-wrap break-words max-h-48 overflow-auto">
                {error?.stack || 'No stack trace available'}
              </pre>

              {errorInfo?.componentStack && (
                <>
                  <p className="text-sm font-semibold text-lb-text-secondary mb-2 mt-4">
                    Component Stack:
                  </p>
                  <pre className="text-xs font-mono text-lb-text-muted whitespace-pre-wrap break-words max-h-48 overflow-auto">
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <p className="mt-6 text-xs text-lb-text-muted text-center">
            If this problem persists, please contact{' '}
            <a href="mailto:support@landlordbot.app" className="text-emerald-400 hover:underline">
              support@landlordbot.app
            </a>
          </p>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;