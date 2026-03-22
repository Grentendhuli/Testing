import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';

// Best practice: 4 hours idle timeout (property management SaaS - medium sensitivity)
// Industry standard: Slack/Notion use 30 days, banking apps use 5-15 min
// Property management needs convenience: 4 hours is optimal
const IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours
const WARNING_BEFORE_LOGOUT_MS = 5 * 60 * 1000; // 5 minute warning

export function useSessionManager() {
  const { isAuthenticated, userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(WARNING_BEFORE_LOGOUT_MS);
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef(Date.now());

  // Check if profile is complete (for dashboard prompts, not hard redirects)
  const isProfileComplete = useCallback(() => {
    if (!userData) return false;
    return !!(
      userData.first_name &&
      userData.last_name &&
      userData.property_address
    );
  }, [userData]);

  // Progressive onboarding: Track incomplete fields, don't force redirect
  const getMissingProfileFields = useCallback(() => {
    if (!userData) return ['first_name', 'last_name', 'property_address'];
    const missing: string[] = [];
    if (!userData.first_name) missing.push('first_name');
    if (!userData.last_name) missing.push('last_name');
    if (!userData.property_address) missing.push('property_address');
    return missing;
  }, [userData]);

  // Activity tracking with proper cleanup
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Only clear warning if showing
    if (showWarning) {
      setShowWarning(false);
    }
    
    // Clear existing timers
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    // Set new idle timer (triggers warning before actual logout)
    idleTimerRef.current = setTimeout(() => {
      console.log('[SessionManager] Idle timeout approaching, showing warning');
      setShowWarning(true);
      
      // Start countdown to actual logout
      const warningEndTime = Date.now() + WARNING_BEFORE_LOGOUT_MS;
      countdownRef.current = setInterval(() => {
        const remaining = warningEndTime - Date.now();
        if (remaining <= 0) {
          // Actually logout now
          console.log('[SessionManager] Logging out due to inactivity');
          if (countdownRef.current) clearInterval(countdownRef.current);
          logout();
          navigate('/login', { replace: true, state: { reason: 'session_expired' } });
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);
      
    }, IDLE_TIMEOUT_MS);
  }, [logout, navigate, showWarning]);

  // Setup activity listeners
  useEffect(() => {
    if (!isAuthenticated) {
      // Clean up timers when logged out
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    // Track various user interactions
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'keypress'];
    
    const handleActivity = () => {
      resetIdleTimer();
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    // Initialize timer
    resetIdleTimer();
    
    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAuthenticated, resetIdleTimer]);

  const dismissWarning = useCallback(() => {
    console.log('[SessionManager] User dismissed warning, extending session');
    setShowWarning(false);
    resetIdleTimer();
  }, [resetIdleTimer]);

  return {
    showWarning,
    timeRemaining,
    dismissWarning,
    isProfileComplete: isProfileComplete(),
    missingProfileFields: getMissingProfileFields(),
    // Format for display: "4:32 remaining"
    formattedTimeRemaining: `${Math.floor(timeRemaining / 60000)}:${Math.floor((timeRemaining % 60000) / 1000).toString().padStart(2, '0')}`,
  };
}
