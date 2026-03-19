import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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
      // App hasn't rendered anything - create fallback UI safely
      const container = fallback || document.createElement('div');
      if (!fallback) {
        (container as HTMLElement).id = 'emergency-fallback';
        (container as HTMLElement).style.cssText = 'padding: 40px; text-align: center; font-family: system-ui; max-width: 600px; margin: 0 auto;';
        document.body.appendChild(container);
      } else {
        // Clear existing content safely
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
      
      // Create elements safely using DOM API (no innerHTML)
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'background: white; border-radius: 16px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);';
      
      const iconContainer = document.createElement('div');
      iconContainer.style.cssText = 'width: 80px; height: 80px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;';
      const icon = document.createElement('span');
      icon.textContent = '⚠️';
      icon.style.fontSize = '40px';
      iconContainer.appendChild(icon);
      
      const title = document.createElement('h1');
      title.textContent = 'App Loading Timeout';
      title.style.cssText = 'font-size: 24px; font-weight: bold; color: #0f172a; margin-bottom: 16px;';
      
      const desc = document.createElement('p');
      desc.textContent = 'The app is taking longer than expected to load. This might be due to:';
      desc.style.cssText = 'color: #64748b; margin-bottom: 24px; line-height: 1.6;';
      
      const list = document.createElement('ul');
      list.style.cssText = 'text-align: left; color: #64748b; margin-bottom: 24px; padding-left: 20px;';
      ['Network connectivity issues', 'Supabase configuration problems', 'Browser compatibility issues'].forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });
      
      const reloadBtn = document.createElement('button');
      reloadBtn.textContent = '🔄 Reload Page';
      reloadBtn.style.cssText = 'padding: 12px 24px; background: #f59e0b; color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 16px; margin-right: 12px;';
      reloadBtn.onclick = () => window.location.reload();
      
      const homeBtn = document.createElement('button');
      homeBtn.textContent = '🏠 Go Home';
      homeBtn.style.cssText = 'padding: 12px 24px; background: transparent; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 16px;';
      homeBtn.onclick = () => window.location.href = '/';
      
      const errorContainer = document.createElement('div');
      errorContainer.style.cssText = 'margin-top: 24px; padding: 16px; background: #f1f5f9; border-radius: 8px; text-align: left;';
      
      const errorText = document.createElement('p');
      errorText.style.cssText = 'font-size: 12px; color: #94a3b8; font-family: monospace; word-break: break-all; white-space: pre-wrap;';
      // Safely stringify errors without HTML injection
      const errorData = errors.slice(0, 5).map(e => JSON.stringify(e)).join('\n');
      errorText.textContent = `Errors: ${errorData}`;
      errorContainer.appendChild(errorText);
      
      wrapper.appendChild(iconContainer);
      wrapper.appendChild(title);
      wrapper.appendChild(desc);
      wrapper.appendChild(list);
      wrapper.appendChild(reloadBtn);
      wrapper.appendChild(homeBtn);
      wrapper.appendChild(errorContainer);
      
      container.appendChild(wrapper);
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
  
  // Clear timeout if render succeeds (short delay to allow initial mount)
  setTimeout(clearRenderTimeout, 100);
  
  if (import.meta.env.DEV) {
    console.log('[DEBUG] render() called successfully');
  }
} catch (error) {
  clearRenderTimeout();
  console.error('[DEBUG] RENDER FAILED:', error);
  errors.push({ type: 'render_error', error: String(error) });
  
  // Show error in page using DOM manipulation (not innerHTML)
  const fallback = document.querySelector('.safari-fallback');
  if (fallback) {
    fallback.innerHTML = ''; // Clear existing content
    
    const container = document.createElement('div');
    container.style.textAlign = 'center';
    
    const h2 = document.createElement('h2');
    h2.style.color = '#dc2626';
    h2.textContent = '❌ App Failed to Load';
    container.appendChild(h2);
    
    const errorP = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = 'Error: ';
    errorP.appendChild(strong);
    errorP.appendChild(document.createTextNode(String(error).substring(0, 200)));
    container.appendChild(errorP);
    
    const countP = document.createElement('p');
    const countStrong = document.createElement('strong');
    countStrong.textContent = 'Errors captured: ';
    countP.appendChild(countStrong);
    countP.appendChild(document.createTextNode(String(errors.length)));
    container.appendChild(countP);
    
    const pre = document.createElement('pre');
    pre.style.textAlign = 'left';
    pre.style.background = '#f3f4f6';
    pre.style.padding = '10px';
    pre.style.borderRadius = '8px';
    pre.style.fontSize = '12px';
    pre.style.maxWidth = '100%';
    pre.style.overflow = 'auto';
    pre.textContent = JSON.stringify(errors, null, 2);
    container.appendChild(pre);
    
    const button = document.createElement('button');
    button.style.marginTop = '20px';
    button.style.padding = '10px 20px';
    button.style.background = '#f59e0b';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.cursor = 'pointer';
    button.textContent = 'Reload Page';
    button.onclick = () => window.location.reload();
    container.appendChild(button);
    
    fallback.appendChild(container);
  }
}

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New content available - please refresh');
                // Optional: Show refresh notification
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('[SW] Service Worker registration failed:', error);
      });
  });
}

// Handle PWA install prompt for Windows/Android
(window as any).deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Store the event so it can be triggered later
  (window as any).deferredPrompt = e;
  console.log('[PWA] Install prompt available');
});

// Handle successful PWA installation
window.addEventListener('appinstalled', () => {
  console.log('[PWA] App installed successfully');
  (window as any).deferredPrompt = null;
});

// DEBUG: Export errors for console access
(window as any).__DEBUG_ERRORS__ = errors;

// Export service worker ready status
(window as any).__SW__ = {
  isRegistered: () => 'serviceWorker' in navigator && !!navigator.serviceWorker.controller,
  unregister: async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.log('[SW] Unregistered');
    }
  }
};
