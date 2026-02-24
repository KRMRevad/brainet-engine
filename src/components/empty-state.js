/**
 * Empty State Component - T15: Empty states in 5 views (landing, pipeline, jobs, stats, graph)
 * Provides consistent empty state UI when no data is available
 */

export const EmptyStateTypes = {
  NO_JOBS: {
    icon: '📭',
    title: 'No Jobs Yet',
    description: 'Start by creating a pipeline to generate content.',
    action: 'Create Pipeline',
    actionView: 'pipeline',
  },
  NO_EXPLORATIONS: {
    icon: '🔍',
    title: 'No Explorations',
    description: 'Roll the dice to start exploring niches and angles.',
    action: 'Roll Dice',
    actionView: 'landing',
  },
  NO_STATS: {
    icon: '📊',
    title: 'No Data Yet',
    description: 'Create and complete jobs to see statistics.',
    action: 'Create Job',
    actionView: 'pipeline',
  },
  NO_CHANNELS: {
    icon: '🌊',
    title: 'No Channels',
    description: 'Spawn channels to start managing your content.',
    action: 'Spawn Channel',
    actionView: 'channel-spawner',
  },
  NO_GRAPH_DATA: {
    icon: '🕸️',
    title: 'No Graph Data',
    description: 'Explore niches to build relationship graphs.',
    action: 'Explore Now',
    actionView: 'landing',
  },
};

/**
 * Render empty state
 * T15: Display empty state with action button
 */
export function renderEmptyState(container, stateType = 'NO_JOBS', onAction = null) {
  if (!container) return;

  const state = EmptyStateTypes[stateType] || EmptyStateTypes.NO_JOBS;

  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';
  emptyState.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: var(--space-2xl);
    text-align: center;
    color: var(--color-neutral-600);
  `;

  // Icon
  const icon = document.createElement('div');
  icon.className = 'empty-state-icon';
  icon.style.cssText = `
    font-size: 3.5rem;
    margin-bottom: var(--space-lg);
    opacity: 0.7;
  `;
  icon.textContent = state.icon;
  emptyState.appendChild(icon);

  // Title
  const title = document.createElement('h2');
  title.style.cssText = `
    font-size: var(--text-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-900);
    margin-bottom: var(--space-sm);
  `;
  title.textContent = state.title;
  emptyState.appendChild(title);

  // Description
  const desc = document.createElement('p');
  desc.style.cssText = `
    font-size: var(--text-sm);
    color: var(--color-neutral-600);
    max-width: 300px;
    margin-bottom: var(--space-lg);
  `;
  desc.textContent = state.description;
  emptyState.appendChild(desc);

  // Action button
  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.textContent = state.action;
  btn.onclick = onAction || (() => {
    window.location.hash = `#${state.actionView}`;
  });
  emptyState.appendChild(btn);

  container.appendChild(emptyState);
  console.log(`✓ T15: Empty state rendered (${stateType})`);
}

/**
 * Show empty state if data is empty
 * T15: Helper to conditionally show empty state
 */
export function showEmptyStateIfNeeded(container, dataArray, stateType, onAction = null) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    renderEmptyState(container, stateType, onAction);
    return true;
  }
  return false;
}

/**
 * Council Warning Banner - T16: Warning banner for council suggestions
 * Displays council alerts and suggestions
 */
export function renderCouncilWarning(container, message, options = {}) {
  if (!container) return;

  const {
    type = 'warning',
    dismissible = true,
    onDismiss = null,
  } = options;

  const banner = document.createElement('div');
  banner.className = 'council-warning';
  banner.setAttribute('role', 'alert');
  banner.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-lg);
    background-color: var(--color-warning);
    color: white;
    font-weight: var(--font-weight-medium);
    animation: slideDown 0.3s ease-out;
  `;

  // Content
  const content = document.createElement('div');
  content.style.cssText = `
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex: 1;
  `;

  const icon = document.createElement('span');
  icon.style.cssText = 'font-size: 1.2rem;';
  switch (type) {
    case 'warning':
      icon.textContent = '⚠️';
      break;
    case 'info':
      icon.textContent = 'ℹ️';
      banner.style.backgroundColor = 'var(--color-secondary)';
      break;
    case 'success':
      icon.textContent = '✅';
      banner.style.backgroundColor = 'var(--color-success)';
      break;
    default:
      icon.textContent = '🔔';
  }

  const text = document.createElement('span');
  text.textContent = message;

  content.appendChild(icon);
  content.appendChild(text);
  banner.appendChild(content);

  // Close button
  if (dismissible) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'council-warning-close';
    closeBtn.innerHTML = '✕';
    closeBtn.setAttribute('aria-label', 'Dismiss warning');
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: var(--text-lg);
      padding: 0;
      display: flex;
      align-items: center;
      transition: opacity var(--transition-fast);
    `;

    closeBtn.onmouseover = () => {
      closeBtn.style.opacity = '0.8';
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.opacity = '1';
    };

    closeBtn.onclick = () => {
      banner.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => {
        banner.remove();
        if (onDismiss) onDismiss();
      }, 300);
    };

    banner.appendChild(closeBtn);
  }

  container.insertBefore(banner, container.firstChild);
  console.log(`✓ T16: Council warning rendered (${type})`);
}

/**
 * Add keyframe animations
 */
export function injectEmptyStateStyles() {
  if (document.getElementById('empty-state-styles')) return;

  const style = document.createElement('style');
  style.id = 'empty-state-styles';
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideUp {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-10px);
      }
    }

    .empty-state {
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .council-warning,
      .empty-state {
        animation: none;
      }
    }
  `;

  document.head.appendChild(style);
}

// Initialize on module load
injectEmptyStateStyles();
console.log('✓ T15: Empty state component loaded');
console.log('✓ T16: Council warning component loaded');
