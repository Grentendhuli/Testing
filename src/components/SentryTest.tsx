import { useState } from 'react';
import { 
  captureError, 
  addBreadcrumb, 
  setUserContext,
  testSentryIntegration,
  trackUserAction,
  trackApiCall
} from '../lib/errorReporting';
import { Button } from './Button';
import { Bug, Activity, User, Navigation, Globe, CheckCircle } from 'lucide-react';

/**
 * SentryTest Component
 * 
 * This component is for testing Sentry error tracking integration.
 * It provides buttons to trigger various types of errors and events.
 * 
 * Usage: Add this component to a test page or route for verification.
 */
export function SentryTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Test 1: Throw a standard error
  const testStandardError = () => {
    try {
      throw new Error('Test standard error - Sentry integration');
    } catch (error) {
      captureError(error as Error, {
        tags: { testType: 'standard-error' },
        extra: { testMessage: 'This is a standard test error' },
      });
      addResult('✅ Standard error sent to Sentry');
    }
  };

  // Test 2: Throw an async error
  const testAsyncError = async () => {
    setIsLoading(true);
    try {
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Test async error - Sentry integration'));
        }, 100);
      });
    } catch (error) {
      captureError(error as Error, {
        tags: { testType: 'async-error' },
        extra: { testMessage: 'This is an async test error' },
      });
      addResult('✅ Async error sent to Sentry');
    } finally {
      setIsLoading(false);
    }
  };

  // Test 3: Add breadcrumbs
  const testBreadcrumbs = () => {
    addBreadcrumb('User clicked test breadcrumb button', 'test', 'info', {
      buttonId: 'test-breadcrumb',
      timestamp: Date.now(),
    });
    addBreadcrumb('Navigation to test page', 'navigation', 'info', {
      from: '/dashboard',
      to: '/test',
    });
    addBreadcrumb('API call simulated', 'api', 'info', {
      endpoint: '/api/test',
      method: 'GET',
      duration: 150,
    });
    addResult('✅ Breadcrumbs added');
  };

  // Test 4: Set user context
  const testUserContext = () => {
    setUserContext({
      id: 'test-user-123',
      subscription_tier: 'pro',
    });
    addResult('✅ User context set (test-user-123)');
  };

  // Test 5: Clear user context
  const testClearUserContext = () => {
    setUserContext(null);
    addResult('✅ User context cleared');
  };

  // Test 6: Track user action
  const testUserAction = () => {
    trackUserAction('test_action', {
      actionType: 'button_click',
      component: 'SentryTest',
    });
    addResult('✅ User action tracked');
  };

  // Test 7: Track API call
  const testApiCall = () => {
    trackApiCall('/api/test-endpoint', 'POST', true, 245);
    addResult('✅ API call tracked');
  };

  // Test 8: Run full integration test
  const testFullIntegration = () => {
    testSentryIntegration();
    addResult('✅ Full integration test executed - check Sentry dashboard');
  };

  // Test 9: Component error (triggers ErrorBoundary)
  const testComponentError = () => {
    addResult('🔄 Triggering component error...');
    // This will be caught by ErrorBoundary
    setTimeout(() => {
      throw new Error('Test component error - should be caught by ErrorBoundary');
    }, 100);
  };

  // Clear results
  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Bug className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sentry Integration Test</h1>
            <p className="text-slate-600">Verify error tracking is working correctly</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Error Tests
            </h2>
            
            <Button
              onClick={testStandardError}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Bug className="w-4 h-4" />
              Test Standard Error
            </Button>

            <Button
              onClick={testAsyncError}
              variant="outline"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" />
              {isLoading ? 'Testing...' : 'Test Async Error'}
            </Button>

            <Button
              onClick={testComponentError}
              variant="primary"
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <Bug className="w-4 h-4" />
              Test ErrorBoundary
            </Button>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Context Tests
            </h2>

            <Button
              onClick={testBreadcrumbs}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Add Breadcrumbs
            </Button>

            <Button
              onClick={testUserContext}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              Set Test User
            </Button>

            <Button
              onClick={testClearUserContext}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              Clear User Context
            </Button>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Tracking Tests
            </h2>

            <Button
              onClick={testUserAction}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Track User Action
            </Button>

            <Button
              onClick={testApiCall}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4" />
              Track API Call
            </Button>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Integration
            </h2>

            <Button
              onClick={testFullIntegration}
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Run Full Test
            </Button>

            <Button
              onClick={clearResults}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              Clear Results
            </Button>
          </div>
        </div>

        {testResults.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Test Results</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="text-sm font-mono text-slate-600 py-1 border-b border-slate-200 last:border-0"
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">
            📋 Verification Steps
          </h3>
          <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
            <li>Click "Run Full Test" to send a test error</li>
            <li>Go to your Sentry dashboard: https://sentry.io/issues/</li>
            <li>Look for the test error with message "Test error - Sentry integration verified"</li>
            <li>Verify error details, tags, and context are captured</li>
            <li>Test ErrorBoundary by clicking the red button</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default SentryTest;
