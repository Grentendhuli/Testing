/**
 * Google Analytics 4 Type Definitions
 * Centralized global type declarations for gtag
 */

declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

export {};
