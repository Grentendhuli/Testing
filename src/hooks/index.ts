import { useState, useEffect, useCallback } from 'react';

export function useTrialCountdown(trialDaysRemaining: number) {
  const [daysRemaining, setDaysRemaining] = useState(trialDaysRemaining);
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low');

  useEffect(() => {
    setDaysRemaining(trialDaysRemaining);
    
    if (trialDaysRemaining <= 5) {
      setUrgency('high');
    } else if (trialDaysRemaining <= 15) {
      setUrgency('medium');
    } else {
      setUrgency('low');
    }
  }, [trialDaysRemaining]);

  const getUrgencyColor = useCallback(() => {
    switch (urgency) {
      case 'high':
        return 'text-amber-500';
      case 'medium':
        return 'text-amber-400';
      default:
        return 'text-emerald-400';
    }
  }, [urgency]);

  return { daysRemaining, urgency, getUrgencyColor };
}

export function useFormatDate() {
  const formatDate = useCallback((dateString: string, options?: Intl.DateTimeFormatOptions) => {
    const date = new Date(dateString);
    const defaultOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleDateString('en-US', options || defaultOptions);
  }, []);

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  }, []);

  const formatRelativeTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  }, []);

  return { formatDate, formatTime, formatRelativeTime };
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useMessageFilter(messages: any[], filter: string) {
  const [filteredMessages, setFilteredMessages] = useState(messages);

  useEffect(() => {
    if (!filter || filter === 'all') {
      setFilteredMessages(messages);
      return;
    }
    
    setFilteredMessages(messages.filter(msg => msg.type === filter));
  }, [messages, filter]);

  return filteredMessages;
}

// Google Calendar hooks
export {
  useGoogleCalendar,
  useGoogleCalendarStatus,
  useMaintenanceCalendar,
  useShowingCalendar,
  useLeaseRenewalCalendar,
} from './useGoogleCalendar';

// NYC Open Data Compliance hooks
export {
  useNYCCompliance,
  useBuildingSearch,
  useGoodCauseEligibility,
  useViolationQueries,
} from './useNYCCompliance';

// Rate limiting hook
export {
  default as useRateLimiter,
  RATE_LIMITS,
  type RateLimitConfig,
  type RateLimitStatus,
} from './useRateLimiter';

// Auth rate limiting hook
export {
  default as useAuthRateLimiter,
  type AuthEndpointType,
  type AuthRateLimitState,
} from './useAuthRateLimiter';

// AI rate limiting hook
export {
  default as useAIRateLimiter,
  type AIRateLimitState,
} from './useAIRateLimiter';
