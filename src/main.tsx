import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import { initSentry } from './lib/sentry';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App.tsx';

// DEBUG: Capture all errors before app loads
const errors: any[] = [];
window.addEventListener('error', (e) => {
  errors.push({ type: 'error', message: e.message, filename: e.filename, lineno: e.lineno, error: e.error?.toString?.() });
  console.error('[PRE-INIT ERROR]', e.message, 'at', e.filename, ':', e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
  errors.push({ type: 'unhandledrejection', reason: e.reason?.toString?.() || String(e.reason) });
  console.error('[PRE-INIT UNHANDLED REJECTION]', e.reason);
});

// Initialize Sentry before app renders
initSentry();

// Build info - only log in development
if (import.meta.env.DEV) {
  console.log('[BUILD] LandlordBot v2.2.0 - Debug logging enabled');
  console.log('[DEBUG] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('[DEBUG] VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
}

// Force render timeout - if app doesn't mount in 8 seconds, show fallback
let renderTimeoutId: number | null = null;

const startRenderTimeout = () => {
  renderTimeoutId = window.setTimeout(() => {
    console.error('[TIMEOUT] App failed to render within 8 seconds');
    const root = document.getElementById('root');
    const fallback = document.querySelector('.safari-fallback');

    if (root && root.children.length === 0) {
      // App hasn't rendered anything
      const container = fallback || document.createElement('div');
      if (!fallback) {
        (container as HTMLElement).id = 'emergency-fallback';
        (container as HTMLElement).style.cssText = 'padding: 40px; text-align: center; font-family: system-ui; max-width: 600px; margin: 0 auto;';
        document.body.appendChild(container);
      }

      container.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
          <h1 style="font-size: 24px; font-weight: bold; color: #0f172a; margin-bottom: 16px;">App Loading Timeout</h1>
          <p style="color: #64748b; margin-bottom: 24px;">The app is taking longer than expected to load.</p>
          <button onclick="window.location.reload()" style="padding: 12px 24px; background: #f59e0b; color: white; border: none; border-radius: 8px; cursor: pointer;">Reload Page</button>
        </div>
      `;
    }
  }, 8000);
};

const clearRenderTimeout = () => {
  if (renderTimeoutId) {
    clearTimeout(renderTimeoutId);
    renderTimeoutId = null;
  }
};

// Check root element
const rootElement = document.getElementById('root');

// Wrap render in try-catch
try {
  if (import.meta.env.DEV) {
    console.log('[DEBUG] Starting React render...');
  }

  startRenderTimeout();
  const root = createRoot(rootElement!);

  if (import.meta.env.DEV) {
    console.log('[DEBUG] createRoot succeeded');
  }

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );

  setTimeout(clearRenderTimeout, 100);

  if (import.meta.env.DEV) {
    console.log('[DEBUG] render() called successfully');
  }
} catch (error) {
  clearRenderTimeout();
  console.error('[DEBUG] RENDER FAILED:', error);

  const fallback = document.querySelector('.safari-fallback');
  if (fallback) {
    fallback.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <h2 style="color: #dc2626;">❌ App Failed to Load</h2>
        <p><strong>Error:</strong> ${String(error).substring(0, 200)}</p>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #f59e0b; color: white; border: none; border-radius: 8px; cursor: pointer;">Reload Page</button>
      </div>
    `;
  }
}

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('[SW] Service Worker registration failed:', error);
      });
  });
}

// DEBUG: Export errors for console access
(window as any).__DEBUG_ERRORS__ = errors;
