/**
 * Critical inline scripts moved to external file for CSP compliance
 * This allows removal of 'unsafe-inline' from script-src CSP
 */

// Runtime Config: Allows env vars to be injected without rebuild
(function() {
  const runtimeConfig = window.__RUNTIME_CONFIG__;
  if (runtimeConfig && runtimeConfig.VITE_CLOUDFLARE_WORKER_URL) {
    window.__CLOUDFLARE_WORKER_URL__ = runtimeConfig.VITE_CLOUDFLARE_WORKER_URL;
  }
})();

// Detect Safari (guard against duplicate declaration)
if (typeof window.isSafari === 'undefined') {
  window.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (window.isSafari) {
    console.log('[Safari Detection] Safari browser detected');
    document.documentElement.classList.add('safari');
  }
}

// Mark JS as loaded
document.documentElement.classList.add('js-loaded');

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('[SW] Service Worker registered:', reg.scope);
      })
      .catch(err => {
        console.warn('[SW] Service Worker registration failed:', err);
      });
  });
}

// CRITICAL: Global error handler to show errors before React loads
window.__CRASH_ERRORS__ = [];
window.addEventListener('error', function(e) {
  // Ignore CORS script errors
  if (e.message === 'Script error.' || e.filename === '') {
    console.warn('[Global Error] CORS/script error from external source (ignored)');
    return;
  }
  
  console.error('[Global Error]', e.message, 'at', e.filename, ':', e.lineno);
  window.__CRASH_ERRORS__.push({
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    error: e.error?.toString?.() || 'N/A'
  });
  
  const errorDiv = document.getElementById('global-error-display');
  if (errorDiv && e.message !== 'Script error.') {
    errorDiv.style.display = 'block';
    errorDiv.innerHTML += '<p style="margin:5px 0;font-size:12px;word-break:break-word;"><strong>Error:</strong> ' + 
      e.message + ' (at ' + (e.filename || 'unknown') + ':' + e.lineno + ')</p>';
  }
});

window.addEventListener('unhandledrejection', function(e) {
  const message = e.reason?.message || e.reason;
  
  // Ignore Supabase lock contention errors (handled internally by GoTrue)
  if (typeof message === 'string' && message.includes('Lock broken by another request')) {
    console.warn('[Supabase Lock] Ignoring non-critical lock contention:', message);
    return;
  }
  
  console.error('[Unhandled Rejection]', e.reason);
  window.__CRASH_ERRORS__.push({
    message: 'Unhandled Promise: ' + message,
    filename: 'promise',
    lineno: 0,
    type: 'rejection'
  });
  
  const errorDiv = document.getElementById('global-error-display');
  if (errorDiv) {
    errorDiv.style.display = 'block';
    errorDiv.innerHTML += '<p style="margin:5px 0;font-size:12px;word-break:break-word;color:#991b1b;"><strong>Promise Error:</strong> ' + 
      message + '</p>';
  }
});
