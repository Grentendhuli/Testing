import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/features/auth';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { SessionExpiredModal } from './components/SessionExpiredModal';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BetaFeedbackBanner } from './components/BetaFeedbackBanner';
import { ForceRebuild } from './components/ForceRebuild';
import { PageLoadingScreen } from './components/PageLoadingScreen';
import { setUserContext, trackNavigation, addBreadcrumb } from './lib/errorReporting';
import { LoginForm, SignupForm, AuthCallback } from '@/features/auth';
import { AuthLoadingScreen } from './components/AuthLoadingScreen';
import { useSessionManager } from './hooks/useSessionManager';
import { SessionWarningModal } from './components/SessionWarningModal';

// Lazy-loaded pages
import {
  Landing,
  LandingSmart,
  Pricing,
  PrivacyPolicy,
  TermsOfService,
  EULA,
  ForgotPassword,
  NotFound,
  Dashboard,
  DashboardSmart,
  Units,
  RentCollection,
  Leases,
  Leads,
  Messages,
  Reports,
  Config,
  Profile,
  Billing,
  LandlordAssistant,
  NYCCompliance,
  MarketInsights,
  Recommendations,
  Listings,
  MaintenanceSmart,
} from './pages/lazyPages';

// Build: Sentry v2.2.0 - Error tracking enabled
if ((import.meta as any).env?.DEV) {
  console.log('LandlordBot v2.2.0 - Sentry Error Tracking Enabled');
}

// Navigation tracker component
function NavigationTracker() {
  const location = useLocation();
  const { user, userData } = useAuth();
  
  // Track navigation changes
  useEffect(() => {
    const previousPath = sessionStorage.getItem('lastPath') || 'initial';
    const currentPath = location.pathname + location.search;
    
    if (previousPath !== currentPath) {
      trackNavigation(previousPath, currentPath);
      sessionStorage.setItem('lastPath', currentPath);
    }
    
    // Add breadcrumb for page view
    addBreadcrumb(
      `Page viewed: ${location.pathname}`,
      'navigation',
      'info',
      { 
        path: location.pathname,
        search: location.search,
        hash: location.hash,
      }
    );
  }, [location]);
  
  // Set user context when authenticated
  useEffect(() => {
    if (user) {
      setUserContext({
        id: user.id,
        email: user.email || undefined,
        subscription_tier: userData?.subscription_tier,
      });
      
      addBreadcrumb(
        'User authenticated',
        'auth',
        'info',
        { userId: user.id }
      );
    } else {
      setUserContext(null);
    }
  }, [user, userData]);
  
  return null;
}

// Loading spinner component - uses AuthLoadingScreen
function AuthLoadingSpinner() {
  return <AuthLoadingScreen message="Loading..." />;
}

// Protected Layout wrapper with session management
function Layout({ children }: { children: React.ReactNode }) {
  const { showWarning, timeRemaining, dismissWarning } = useSessionManager();
  
  return (
    <div className="flex min-h-screen bg-slate-50 transition-colors duration-200">
      {showWarning && (
        <SessionWarningModal 
          timeRemaining={timeRemaining} 
          onDismiss={dismissWarning} 
        />
      )}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <BetaFeedbackBanner />
    </div>
  );
}

// Public routes don't require auth
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth();
  
  // Wait for auth initialization before making any decisions
  if (!isInitialized) {
    return <AuthLoadingSpinner />;
  }
  
  // Only redirect after initialization is complete
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

// Protected routes require auth
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, showSessionExpiredModal, setShowSessionExpiredModal } = useAuth();
  const location = useLocation();
  
  // CRITICAL: Wait for auth initialization before making ANY decisions
  // This prevents the redirect loop caused by race conditions
  if (!isInitialized) {
    return <AuthLoadingSpinner />;
  }
  
  // Only redirect to login after we've confirmed the user is not authenticated
  if (!isAuthenticated) {
    // Preserve the intended destination for post-login redirect
    // Include the full path with search params for complete return URL
    const returnUrl = location.pathname + location.search;
    return <Navigate to={`/login?return=${encodeURIComponent(returnUrl)}`} replace />;
  }
  
  return (
    <>
      <Layout>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </Layout>
      {/* Session Expired Modal - shown over current page */}
      <SessionExpiredModal 
        isOpen={showSessionExpiredModal}
        onClose={() => setShowSessionExpiredModal(false)}
        currentPath={location.pathname + location.search}
      />
    </>
  );
}

// Note: AuthCallback handles its own loading states and redirects
// It navigates to /dashboard on success, so no wrapper is needed

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <AppProvider>
              <NavigationTracker />
              <ForceRebuild />
              <ErrorBoundary>
                <Suspense fallback={<PageLoadingScreen />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={
                      <PublicRoute>
                        <LandingSmart />
                      </PublicRoute>
                    } />
                    <Route path="/legacy" element={
                      <PublicRoute>
                        <Landing />
                      </PublicRoute>
                    } />
                    <Route path="/login" element={
                      <PublicRoute>
                        <LoginForm />
                      </PublicRoute>
                    } />
                    <Route path="/signup" element={
                      <PublicRoute>
                        <SignupForm />
                      </PublicRoute>
                    } />
                    <Route path="/forgot-password" element={
                      <PublicRoute>
                        <ForgotPassword />
                      </PublicRoute>
                    } />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/eula" element={<EULA />} />
                    <Route path="/pricing" element={<Pricing />} />

                    {/* OAuth Callback Route - Handles its own loading/success/error states */}
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* Protected Routes - AI Enhanced */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <DashboardSmart />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard-classic" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/units" element={
                      <ProtectedRoute>
                        <Units />
                      </ProtectedRoute>
                    } />
                    <Route path="/rent" element={
                      <ProtectedRoute>
                        <RentCollection />
                      </ProtectedRoute>
                    } />
                    <Route path="/leases" element={
                      <ProtectedRoute>
                        <Leases />
                      </ProtectedRoute>
                    } />
                    <Route path="/leads" element={
                      <ProtectedRoute>
                        <Leads />
                      </ProtectedRoute>
                    } />
                    <Route path="/maintenance" element={
                      <ProtectedRoute>
                        <MaintenanceSmart />
                      </ProtectedRoute>
                    } />
                    <Route path="/messages" element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    } />
                    <Route path="/reports" element={
                      <ProtectedRoute>
                        <Reports />
                      </ProtectedRoute>
                    } />
                    <Route path="/config" element={
                      <ProtectedRoute>
                        <Config />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="/billing" element={
                      <ProtectedRoute>
                        <Billing />
                      </ProtectedRoute>
                    } />
                    <Route path="/concierge" element={
                      <ProtectedRoute>
                        <Billing />
                      </ProtectedRoute>
                    } />
                    <Route path="/assistant" element={<ProtectedRoute><LandlordAssistant /></ProtectedRoute>} />
                    <Route path="/nyc-compliance" element={<ProtectedRoute><NYCCompliance /></ProtectedRoute>} />
                    <Route path="/market-insights" element={<ProtectedRoute><MarketInsights /></ProtectedRoute>} />
                    <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
                    <Route path="/listings" element={<ProtectedRoute><Listings /></ProtectedRoute>} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </AppProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
