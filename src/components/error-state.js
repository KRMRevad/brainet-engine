/**
 * Error State Component - T9: Error handling in secondary views
 * Provides consistent error UI across all views with recovery options
 */

import { escapeHtml } from '../utils.js'

/**
 * Error state types and messages
 */
export const ErrorTypes = {
  NOT_FOUND: {
    icon: '🔍',
    title: 'Not Found',
    description: 'The requested resource could not be found.',
  },
  NETWORK_ERROR: {
    icon: '🌐',
    title: 'Network Error',
    description: 'Unable to connect to the server. Please check your connection.',
  },
  PERMISSION_DENIED: {
    icon: '🔒',
    title: 'Access Denied',
    description: 'You do not have permission to access this resource.',
  },
  SERVER_ERROR: {
    icon: '⚠️',
    title: 'Server Error',
    description: 'The server encountered an error. Please try again later.',
  },
  VALIDATION_ERROR: {
    icon: '❌',
    title: 'Validation Error',
    description: 'Invalid input. Please check your data and try again.',
  },
  TIMEOUT: {
    icon: '⏱️',
    title: 'Request Timeout',
    description: 'The request took too long. Please try again.',
  },
  UNKNOWN: {
    icon: '⚡',
    title: 'Unknown Error',
    description: 'An unexpected error occurred. Please try again.',
  },
};

/**
 * Render error state UI in container
 * T9: Display error with recovery options
 */
export function renderErrorState(container, errorType = 'UNKNOWN', options = {}) {
  if (!container) return;

  const error = ErrorTypes[errorType] || ErrorTypes.UNKNOWN;
  const {
    title = error.title,
    description = error.description,
    icon = error.icon,
    details = null,
    onRetry = null,
    onNavigateHome = null,
    showDetails = false,
  } = options;

  // Clear container
  container.innerHTML = '';

  // Error state element
  const errorState = document.createElement('div');
  errorState.className = 'error-state';
  errorState.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: var(--space-2xl);
    text-align: center;
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-subtle);
  `;

  // Icon
  const iconEl = document.createElement('div');
  iconEl.style.cssText = `
    font-size: 4rem;
    margin-bottom: var(--space-lg);
    opacity: 0.8;
  `;
  iconEl.textContent = icon;
  errorState.appendChild(iconEl);

  // Title
  const titleEl = document.createElement('h2');
  titleEl.style.cssText = `
    margin-bottom: var(--space-sm);
    color: var(--text-primary);
  `;
  titleEl.textContent = title;
  errorState.appendChild(titleEl);

  // Description
  const descEl = document.createElement('p');
  descEl.style.cssText = `
    color: var(--text-secondary);
    max-width: 400px;
    margin-bottom: var(--space-lg);
    font-size: 0.95rem;
    line-height: 1.6;
  `;
  descEl.textContent = description;
  errorState.appendChild(descEl);

  // Error details (if provided and showDetails enabled)
  if (details && showDetails) {
    const detailsEl = document.createElement('div');
    detailsEl.style.cssText = `
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: var(--space-md);
      margin-bottom: var(--space-lg);
      text-align: left;
      max-height: 200px;
      overflow-y: auto;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.75rem;
      color: var(--text-muted);
    `;
    detailsEl.innerHTML = `<details style="cursor: pointer;">
      <summary style="font-weight: 600; margin-bottom: var(--space-sm); color: var(--text-secondary);">Error Details</summary>
      <pre style="margin: 0; white-space: pre-wrap; word-break: break-word;">${escapeHtml(details)}</pre>
    </details>`;
    errorState.appendChild(detailsEl);
  }

  // Action buttons
  const actions = document.createElement('div');
  actions.style.cssText = `
    display: flex;
    gap: var(--space-md);
    flex-wrap: wrap;
    justify-content: center;
  `;

  // Retry button
  if (onRetry) {
    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn btn-primary';
    retryBtn.textContent = '🔄 Try Again';
    retryBtn.onclick = onRetry;
    actions.appendChild(retryBtn);
  }

  // Home button
  const homeBtn = document.createElement('button');
  homeBtn.className = 'btn';
  homeBtn.textContent = '🏠 Go Home';
  homeBtn.onclick = onNavigateHome || (() => {
    window.location.hash = '#landing';
  });
  actions.appendChild(homeBtn);

  errorState.appendChild(actions);
  container.appendChild(errorState);
}

/**
 * HTTP status to error type mapper
 * T9: Handle various API error scenarios
 */
export function getErrorTypeFromStatus(statusCode) {
  switch (statusCode) {
    case 400:
      return 'VALIDATION_ERROR';
    case 403:
      return 'PERMISSION_DENIED';
    case 404:
      return 'NOT_FOUND';
    case 408:
    case 504:
      return 'TIMEOUT';
    case 500:
    case 502:
    case 503:
      return 'SERVER_ERROR';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Handle API error response
 * T9: Centralized error handling for API calls
 */
export async function handleApiError(error, container = null) {
  console.error('API Error:', error);

  let errorType = 'UNKNOWN';
  let details = null;

  if (error.response) {
    // HTTP error response
    errorType = getErrorTypeFromStatus(error.response.status);
    details = error.response.statusText || error.message;
  } else if (error.message === 'Network Error' || !navigator.onLine) {
    errorType = 'NETWORK_ERROR';
    details = 'No internet connection';
  } else if (error.code === 'ECONNABORTED') {
    errorType = 'TIMEOUT';
    details = 'Request timeout (timeout > 30s)';
  } else {
    errorType = 'UNKNOWN';
    details = error.message;
  }

  // Render error state if container provided
  if (container) {
    renderErrorState(container, errorType, {
      details,
      showDetails: true,
    });
  }

  return { errorType, details };
}

/**
 * Wrap async function with error handling
 * T9: Try-catch wrapper with error state rendering
 */
export async function withErrorHandling(asyncFn, container, retryFn = null) {
  try {
    return await asyncFn();
  } catch (error) {
    const { errorType, details } = await handleApiError(error);

    if (container) {
      renderErrorState(container, errorType, {
        details,
        showDetails: false,
        onRetry: retryFn,
      });
    }

    throw error; // Re-throw for caller if needed
  }
}

/**
 * Network error listener
 * T9: Detect connectivity changes
 */
export function initNetworkErrorListener() {
  window.addEventListener('offline', () => {
    console.warn('Network offline');
    showNetworkErrorBanner();
  });

  window.addEventListener('online', () => {
    console.log('Network online');
    hideNetworkErrorBanner();
  });
}

/**
 * Show network error banner
 * T9: Alert user about connectivity issues
 */
export function showNetworkErrorBanner() {
  if (document.getElementById('network-error-banner')) return; // Already shown

  const banner = document.createElement('div');
  banner.id = 'network-error-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: var(--color-danger);
    color: white;
    padding: var(--space-md);
    text-align: center;
    font-weight: 600;
  `;
  banner.textContent = '🌐 No internet connection. Please check your connection.';
  document.body.appendChild(banner);
}

/**
 * Hide network error banner
 */
export function hideNetworkErrorBanner() {
  const banner = document.getElementById('network-error-banner');
  if (banner) banner.remove();
}

// Initialize network error listener on module load
initNetworkErrorListener();
console.log('✓ T9: Error state handler initialized');
