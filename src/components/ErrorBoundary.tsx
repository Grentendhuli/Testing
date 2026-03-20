import React, { Component, ReactNode, ErrorInfo } from 'react';

// Safe error reporting - don't crash if error reporting fails
function safeReport(error: Error, errorInfo: ErrorInfo, errorId: string) {
  try {
    console.error('[ErrorBoundary]', error, errorInfo);
    // Report to console only - avoid circular dependencies
  } catch (e) {
    // Silently fail
  }
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorId: '',
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    safeReport(error, errorInfo, this.state.errorId);
    this.props.onError?.(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <span style={{ fontSize: '40px' }}>⚠️</span>
            </div>
            
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#0f172a',
              marginBottom: '8px'
            }}>
              Something went wrong
            </h1>
            
            <p style={{
              color: '#64748b',
              marginBottom: '24px'
            }}>
              We apologize for the inconvenience. Please try reloading the page.
            </p>
            
            <div style={{
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '4px'
              }}>Error Reference ID</p>
              <code style={{
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#334155',
                backgroundColor: 'white',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>
                {this.state.errorId}
              </code>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f59e0b',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                🔄 Reload Page
              </button>
              
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                🏠 Go Home
              </button>
            </div>
            
            {(import.meta as any).env?.DEV && this.state.error && (
              <div style={{
                marginTop: '24px',
                textAlign: 'left'
              }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#334155',
                  marginBottom: '8px'
                }}>Development Details:</p>
                <pre style={{
                  backgroundColor: '#0f172a',
                  color: '#f87171',
                  padding: '16px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}

// Hook for functional components to catch async errors
export function useErrorHandler() {
  return (error: Error) => {
    console.error('[useErrorHandler]', error);
    throw error;
  };
}

// Wrapper component for async error handling
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
