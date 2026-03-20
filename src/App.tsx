import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/features/auth';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BetaFeedbackBanner } from './components/BetaFeedbackBanner';
import { ForceRebuild } from './components/ForceRebuild';
import { setUserContext, trackNavigation, addBreadcrumb } from './lib/errorReporting';
import { LoginForm, SignupForm, AuthCallback } from '@/features/auth';
import { AuthLoadingScreen } from './components/AuthLoadingScreen';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Units } from './pages/Units';
import { RentCollection } from './pages/RentCollection';
import { Leases } from './pages/Leases';
import { Leads } from './pages/Leads';
import { Messages } from './pages/Messages';
import { Reports } from './pages/Reports';
import { Config } from './pages/Config';
import { Profile } from './pages/Profile';
import { Billing } from './pages/Billing';
import { Pricing } from './pages/Pricing';
import { NotFound } from './pages/NotFound';
import { LandlordAssistant } from './pages/LandlordAssistant';
import { NYCCompliance } from './pages/NYCCompliance';
import { MarketInsights } from './pages/MarketInsights';
import { Recommendations } from './pages/Recommendations';
import { Listings } from './pages/Listings';

// AI-Enhanced Pages
import { DashboardSmart } from './pages/DashboardSmart';
import { LandingSmart } from './pages/LandingSmart';
import { MaintenanceSmart } from './pages/MaintenanceSmart';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { EULA } from './pages/EULA';

import './App.css';

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
  const { isInitialized, isLoading, authState } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowDebug(true), 3000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <AuthLoadingScreen
      message="Loading..."
      showDebug={showDebug}
      isInitialized={isInitialized}
      isLoading={isLoading}
      authState={authState}
    />
  );
}

// Protected Layout wrapper
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 transition-colors duration-200">
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
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  
  // Wait for auth initialization before making any decisions
  if (!isInitialized || isLoading) {
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
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const location = useLocation();
  
  // CRITICAL: Wait for auth initialization before making ANY decisions
  // This prevents the redirect loop caused by race conditions
  if (!isInitialized || isLoading) {
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
    <Layout>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </Layout>
  );
}

// OAuth callback route - handles the OAuth redirect
function CallbackRoute() {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const [hasProcessed, setHasProcessed] = useState(false);
  
  useEffect(() => {
    // Give the callback time to process
    const timer = setTimeout(() => {
      setHasProcessed(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Show loading while processing or initializing
  if (!isInitialized || isLoading || !hasProcessed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Completing sign in...</p>
          <p className="mt-2 text-sm text-slate-500">Please wait while we authenticate you</p>
        </div>
      </div>
    );
  }
  
  // After processing, redirect based on auth state
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If not authenticated after processing, something went wrong
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <AppProvider>
              <NavigationTracker />
              <ForceRebuild />
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
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/eula" element={<EULA />} />
                <Route path="/pricing" element={<Pricing />} />

                {/* OAuth Callback Route - Special handling */}
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
            </AppProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
