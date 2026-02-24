/**
 * History Manager - T10: History API integration for SPA navigation
 * Manages browser history with popstate events and pushState for back button support
 */

class HistoryManager {
  constructor() {
    this.stack = [];
    this.currentView = null;
    this.onNavigate = null;

    // Listen for back button
    window.addEventListener('popstate', (e) => this.handlePopState(e));
  }

  /**
   * Push new view to history
   * T10 AC-10: Use History API pushState for navigation
   */
  push(viewName, state = {}, title = '') {
    // Validate inputs
    if (!viewName) {
      console.warn('History: viewName is required');
      return;
    }

    // Add to stack
    this.stack.push({
      view: viewName,
      state,
      timestamp: Date.now(),
    });

    this.currentView = viewName;

    // Push to browser history
    if (window.history.pushState) {
      const fullState = { view: viewName, ...state };
      const url = this.buildUrl(viewName, state);
      const pageTitle = title || viewName;

      window.history.pushState(fullState, pageTitle, url);
      console.log(`📍 History: pushed "${viewName}" → ${url}`);
    }
  }

  /**
   * Replace current history entry (without adding to stack)
   * Useful for state updates within same view
   */
  replace(viewName, state = {}, title = '') {
    if (!viewName) return;

    this.currentView = viewName;

    if (window.history.replaceState) {
      const fullState = { view: viewName, ...state };
      const url = this.buildUrl(viewName, state);

      window.history.replaceState(fullState, title || viewName, url);
      console.log(`🔄 History: replaced "${viewName}"`);
    }
  }

  /**
   * Handle back button click
   * T10 AC-10: Back button support with guard
   */
  canGoBack() {
    return window.history.length > 1;
  }

  /**
   * Go back in history
   * Guards against going before app entry point
   */
  back() {
    if (this.canGoBack()) {
      window.history.back();
      return true;
    }
    return false;
  }

  /**
   * Handle popstate event (back button)
   * T10: Navigate when browser back button is pressed
   */
  handlePopState(event) {
    const state = event.state || {};
    const viewName = state.view || 'landing';

    console.log(`⬅️ History: popstate detected, navigating to "${viewName}"`);

    // Update current view
    this.currentView = viewName;

    // Remove last item from stack (since browser will handle the navigation)
    if (this.stack.length > 0) {
      this.stack.pop();
    }

    // Notify listeners
    if (this.onNavigate) {
      this.onNavigate(viewName, state);
    }
  }

  /**
   * Build URL from view name and state
   * Simple: #viewName or #viewName/id
   */
  buildUrl(viewName, state = {}) {
    let url = `#${viewName}`;

    if (state.id) {
      url += `/${state.id}`;
    }

    return url;
  }

  /**
   * Parse current URL to view and state
   */
  static parseCurrentUrl() {
    const hash = window.location.hash.slice(1); // Remove #
    if (!hash) return { view: 'landing', state: {} };

    const parts = hash.split('/');
    const view = parts[0] || 'landing';
    const id = parts[1] || null;

    return {
      view,
      state: id ? { id } : {},
    };
  }

  /**
   * Register navigation callback
   * Called when history navigation occurs
   */
  onNavigation(callback) {
    this.onNavigate = callback;
  }

  /**
   * Get history stack (for debugging)
   */
  getStack() {
    return [...this.stack];
  }

  /**
   * Clear history
   */
  clear() {
    this.stack = [];
    this.currentView = null;
  }
}

// Create singleton instance
export const historyManager = new HistoryManager();

/**
 * Navigate to view with history tracking
 * T10: Centralized navigation function
 */
export function navigateWithHistory(viewName, state = {}, title = '') {
  historyManager.push(viewName, state, title);
  console.log(`✓ T10: Navigated to ${viewName} with History API`);
}

/**
 * Navigate back with guard
 * T10 AC-10: Back button with history guard
 */
export function navigateBack() {
  if (historyManager.canGoBack()) {
    historyManager.back();
    return true;
  } else {
    // Fallback: navigate to landing
    window.location.hash = '#landing';
    return false;
  }
}

/**
 * Update current view state without pushing new history
 * Useful for form updates, filters, etc.
 */
export function updateHistoryState(state = {}) {
  if (window.history.replaceState) {
    const currentUrl = window.location.href;
    const fullState = {
      view: historyManager.currentView,
      ...state,
    };
    window.history.replaceState(fullState, '', currentUrl);
  }
}

/**
 * Initialize history manager
 * Should be called once when app starts
 */
export function initHistoryManager(navigationCallback) {
  historyManager.onNavigation(navigationCallback);

  // Initialize from current URL
  const { view, state } = HistoryManager.parseCurrentUrl();
  historyManager.currentView = view;

  console.log('✓ T10: History Manager initialized');
  console.log(`  Current view: ${view}`);
  console.log(`  Can go back: ${historyManager.canGoBack()}`);
}

// Handle hash-based routing with history
window.addEventListener('hashchange', () => {
  const { view, state } = HistoryManager.parseCurrentUrl();

  if (view !== historyManager.currentView) {
    historyManager.currentView = view;

    if (historyManager.onNavigate) {
      historyManager.onNavigate(view, state);
    }
  }
});

console.log('✓ T10: History manager module loaded');
