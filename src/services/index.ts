// API Services exports
export { 
  RentometerService, 
  rentometerService, 
  generateDemoMarketInsight,
  type RentometerCompsResponse,
  type RentometerAddressSearchRequest,
} from './rentometer';

export { 
  VapiService, 
  vapiService,
  mockAdvisorService,
  type VapiCallRequest,
  type VapiCallResponse,
} from './vapi';

// Calendly removed - using free alternatives

export { 
  ReportService, 
  reportService,
  type ReportGenerationRequest,
  type ExpenseItem,
  type ScheduleEData,
} from './reports';

export { 
  RecommendationsService, 
  recommendationsService,
  RENOVATION_COSTS,
  VENDOR_DATABASE,
  type PropertyAnalytics,
} from './recommendations';

// QuickBooks removed - using free alternatives

// NEW SERVICES

// Twilio removed - using free alternatives

export { 
  PropertyValuationService, 
  propertyValuationService,
  type PropertyValuation,
  type PropertyValuationRequest,
  type PropertyComparable,
} from './propertyValuation';

export { 
  ListingsAPIService,
  listingsAPIService,
  LISTING_PLATFORMS,
  type ListingPlatform,
  type ListingSource,
  type IncomingLead,
  type ListingConnectionConfig,
  type ListingPost,
} from './listingsAPI';

export {
  AdvisorService,
  advisorService,
  GRENTEN_DHULI_PROFILE,
  ADDITIONAL_ADVISORS,
  ALL_ADVISORS,
  type AdvisorProfile,
  type BookingRequest,
  type BookingResponse,
} from './advisorBooking';

// AI Usage Tracking Service - Unlimited on free tier
export {
  checkAIQuota,
  incrementAIUsage,
  getAIUsageStatus,
  validateAIQuota,
  getAIUsageHistory,
  type AIQuotaStatus,
  type AIUsageRecord,
  type AIUsageFullStatus,
} from './aiUsage';

// Google Calendar Integration
export {
  GoogleCalendarService,
  initGoogleAuth,
  signInWithGoogle,
  handleAuthCallback,
  isGoogleCalendarConnected,
  disconnectGoogleCalendar,
  createMaintenanceEvent,
  createShowingEvent,
  createLeaseRenewalReminder,
  getUpcomingEvents,
  getLandlordBotEvents,
  deleteEvent,
  updateEvent,
  getEvent,
  type MaintenanceEventDetails,
  type ShowingEventDetails,
  type LeaseRenewalDetails,
  type CalendarEvent,
} from './googleCalendar';

// SendGrid Email Service
export {
  sendWelcomeEmail,
  sendRentReceiptEmail,
  sendMaintenanceUpdateEmail,
  sendLatePaymentReminder,
  sendAILimitReachedEmail,
} from './sendgrid';

// NYC Open Data Service
export {
  NYCOpenDataService,
  getHPDViolations,
  checkRentStabilization,
  getBuildingCodeViolations,
  getBuildingInfo,
  searchBuildingByAddress,
  getGoodCauseEvictionEligibility,
  runComplianceCheck,
  parseBBL,
  getBoroughName,
  getViolationClassDescription,
  GOOD_CAUSE_RENT_THRESHOLD_2025,
  type HPDViolation,
  type DOBViolation,
  type RentStabilizationRecord,
  type BuildingInfo,
  type ComplianceCheckResult,
  type GoodCauseEligibilityInput,
} from './nycOpenData';

// Zillow API Service
export {
  ZillowService,
  zillowService,
  getRentEstimate,
  getPropertyDetails,
  getComparableRentals,
  getMarketTrends,
  analyzeRentGap,
  searchProperties,
  isZillowConfigured,
  getZillowStatus,
  getZillowConfigInstructions,
  clearZillowCache,
  getZillowCacheStats,
  type ZillowRentEstimate,
  type ZillowPropertyDetails,
  type ZillowComparableRental,
  type ZillowMarketTrends,
  type RentGapAnalysis,
} from './zillow';

// DocuSeal Document Signing Service
export {
  isDocuSealConfigured,
  createTemplateFromHTML,
  createTemplateFromPDF,
  getTemplates,
  getTemplate,
  deleteTemplate,
  sendDocumentForSignature,
  sendLeaseForSignature,
  getDocumentStatus,
  getTemplateSubmissions,
  getSignedDocumentUrl,
  cancelSubmission,
  sendReminder,
  verifyWebhookSignature,
  handleWebhookEvent,
  createDocumentFromTemplate,
  type DocumentStatus,
  type FieldType,
  type TemplateField,
  type DocumentTemplate,
  type SubmitterConfig,
  type DocumentSubmission,
  type Submitter,
  type SigningStatus,
} from './docuseal';

// Payment Methods Service - PayPal, Zelle, Venmo, Apple Cash
export {
  paymentMethodsService,
  SUPPORTED_PAYMENT_METHODS,
  type PaymentMethodId,
  type PaymentMethodConfig,
} from './paymentMethods';
