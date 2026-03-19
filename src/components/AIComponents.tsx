/**
 * LandlordBot AI-First UX Components
 * 
 * This module exports all AI-enhanced components for building intelligent
 * property management interfaces with confidence indicators, smart suggestions,
 * and contextual automation.
 */

// Core AI Components
export { 
  ConfidenceBadge,
  ConfidenceBadgeCompact,
  ConfidenceIndicator 
} from './ConfidenceBadge';

export { 
  AIActionButton,
  AIActionButtonCompact 
} from './AIActionButton';

export { 
  SmartSuggestion,
  SmartSuggestionsContainer 
} from './SmartSuggestion';

export { 
  AutoCompleteInput,
  AutoCompleteSelect 
} from './AutoCompleteInput';

export { 
  AICommandPalette,
  AICommandPaletteButton 
} from './AICommandPalette';

export { 
  ProactiveNotificationCard,
  ProactiveNotificationFeed 
} from './ProactiveNotification';

export { 
  SmartMetricCard,
  SmartMetricGrid 
} from './SmartMetricCard';

// Types
export type { 
  ConfidenceBadgeProps 
} from './ConfidenceBadge';

export type { 
  AIActionButtonProps 
} from './AIActionButton';

export type { 
  SmartSuggestionProps,
  SuggestionType,
  SuggestionPriority 
} from './SmartSuggestion';

export type { 
  AutoCompleteInputProps,
  AutoCompleteOption 
} from './AutoCompleteInput';

export type { 
  ProactiveNotification,
  NotificationType,
  NotificationPriority 
} from './ProactiveNotification';

export type { 
  SmartMetricCardProps,
  MetricInsight,
  MetricTrend 
} from './SmartMetricCard';

// Component Registry
export const AIComponents = {
  ConfidenceBadge: 'ConfidenceBadge',
  AIActionButton: 'AIActionButton',
  SmartSuggestion: 'SmartSuggestion',
  AutoCompleteInput: 'AutoCompleteInput',
  AICommandPalette: 'AICommandPalette',
  ProactiveNotificationCard: 'ProactiveNotificationCard',
  SmartMetricCard: 'SmartMetricCard',
} as const;

// Usage Guidelines
export const AIGuidelines = {
  // Confidence Score Interpretation
  confidence: {
    high: { min: 90, color: 'emerald', behavior: 'auto-execute with notification' },
    good: { min: 70, max: 89, color: 'blue', behavior: 'quick confirm recommended' },
    medium: { min: 50, max: 69, color: 'amber', behavior: 'needs approval' },
    low: { max: 49, color: 'slate', behavior: 'human decision required' },
  },
  
  // Animation Defaults
  animations: {
    default: 'transition-all duration-200',
    emphasis: 'transition-all duration-300',
    feedback: 'transition-all duration-150',
  },
  
  // Responsive Breakpoints
  responsive: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  }
} as const;

// Installation Instructions
/**
 * To use AI Components:
 * 
 * 1. Import the specific components you need:
 *    import { ConfidenceBadge, AIActionButton } from './AIComponents';
 * 
 * 2. Or import all AI components:
 *    import * as AI from './AIComponents';
 * 
 * 3. Components expect these dependencies:
 *    - lucide-react (icons)
 *    - Tailwind CSS (styling)
 *    - React 18+
 * 
 * 4. Optional: Import types for TypeScript
 *    import type { ConfidenceBadgeProps } from './AIComponents';
 */

// Example Usage Patterns
/**
 * Confidence Indicator:
 * 
 * <ConfidenceBadge confidence={85} showExplanation 
 *   explanation="AI detected priority indicators: water damage + emergency keywords" />
 * 
 * Action Button with AI:
 * 
 * <AIActionButton
 *   confidence={92}
 *   onAction={() => sendReminders()}
 *   reasoning="Based on payment history, these tenants respond to reminders"
 * >
 *   Send Reminders
 * </AIActionButton>
 * 
 * Smart Suggestion:
 * 
 * <SmartSuggestion
 *   id="rent-optimization"
 *   type="opportunity"
 *   priority="medium"
 *   title="Rent Optimization"
 *   description="Unit 2B is $200 below market rate"
 *   confidence={82}
 *   action={{ label: 'Adjust pricing', onClick: () => {} }}
 *   onDismiss={() => {}}
 * />
 * 
 * Auto-Complete Input:
 * 
 * <AutoCompleteInput
 *   label="Description"
 *   value={description}
 *   onChange={setDescription}
 *   context={{ formType: 'maintenance', unitId: '3A' }}
 *   getSuggestions={fetchSuggestions}
 * />
 * 
 * Command Palette:
 * 
 * <AICommandPalette
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onCommand={handleCommand}
 * />
 */
