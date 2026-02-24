/**
 * Skeleton Loader Component - T8: Async view loading indicators
 * Displays placeholder skeletons while content loads
 */

/**
 * Create a skeleton card placeholder
 * Used for list items, grid items, cards
 */
export function createSkeletonCard() {
  const card = document.createElement('div');
  card.className = 'skeleton-card';
  card.innerHTML = `
    <div class="skeleton-header">
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line skeleton-badge" style="width: 80px;"></div>
    </div>
    <div class="skeleton-meta">
      <div class="skeleton-line" style="width: 60%;"></div>
      <div class="skeleton-line" style="width: 40%;"></div>
    </div>
    <div class="skeleton-footer">
      <div class="skeleton-line" style="width: 100px;"></div>
    </div>
  `;
  return card;
}

/**
 * Create a skeleton text placeholder
 * Used for paragraph content
 */
export function createSkeletonText(lines = 3) {
  const container = document.createElement('div');
  container.className = 'skeleton-text';

  for (let i = 0; i < lines; i++) {
    const line = document.createElement('div');
    line.className = 'skeleton-line';
    if (i === lines - 1) {
      line.style.width = '60%'; // Last line shorter
    }
    container.appendChild(line);
  }

  return container;
}

/**
 * Create a skeleton detail view placeholder
 * Used for detail page loading
 */
export function createSkeletonDetail() {
  const detail = document.createElement('div');
  detail.className = 'skeleton-detail';
  detail.innerHTML = `
    <div class="skeleton-header">
      <div class="skeleton-avatar"></div>
      <div style="flex: 1;">
        <div class="skeleton-line" style="height: 2rem; width: 40%;"></div>
        <div class="skeleton-line" style="width: 60%; margin-top: 8px;"></div>
      </div>
    </div>

    <div class="skeleton-section">
      <div class="skeleton-line" style="width: 30%; height: 1.2rem;"></div>
      <div style="margin-top: 12px;">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line" style="width: 70%;"></div>
      </div>
    </div>

    <div class="skeleton-section">
      <div class="skeleton-line" style="width: 30%; height: 1.2rem;"></div>
      <div style="margin-top: 12px;">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
    </div>
  `;
  return detail;
}

/**
 * Create a skeleton grid (for card lists)
 * T8: Multiple skeleton cards for list loading
 */
export function createSkeletonGrid(count = 4) {
  const grid = document.createElement('div');
  grid.className = 'skeleton-grid';

  for (let i = 0; i < count; i++) {
    grid.appendChild(createSkeletonCard());
  }

  return grid;
}

/**
 * Replace element with skeleton loader
 * Useful for progressive loading
 */
export function showSkeletonLoader(container, type = 'card') {
  if (!container) return;

  let skeleton;
  switch (type) {
    case 'detail':
      skeleton = createSkeletonDetail();
      break;
    case 'text':
      skeleton = createSkeletonText();
      break;
    case 'grid':
      skeleton = createSkeletonGrid();
      break;
    case 'card':
    default:
      skeleton = createSkeletonCard();
      break;
  }

  container.innerHTML = '';
  container.appendChild(skeleton);
}

/**
 * Inject skeleton CSS styles
 * T8: Add animations and styles for skeleton loaders
 */
export function injectSkeletonStyles() {
  if (document.getElementById('skeleton-styles')) return; // Already injected

  const style = document.createElement('style');
  style.id = 'skeleton-styles';
  style.textContent = `
    /* Skeleton Loader Styles - T8 */

    .skeleton-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    .skeleton-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-md);
    }

    .skeleton-title {
      height: 1.5rem;
      width: 60%;
    }

    .skeleton-badge {
      height: 2rem;
      border-radius: var(--radius-full);
    }

    .skeleton-meta {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      margin-bottom: var(--space-md);
    }

    .skeleton-footer {
      display: flex;
      gap: var(--space-md);
    }

    .skeleton-line {
      height: 0.875rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      margin-bottom: var(--space-sm);
    }

    .skeleton-text {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .skeleton-detail {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    .skeleton-header {
      display: flex;
      gap: var(--space-md);
      padding-bottom: var(--space-lg);
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: var(--space-lg);
    }

    .skeleton-avatar {
      width: 80px;
      height: 80px;
      border-radius: var(--radius-lg);
      background: var(--bg-secondary);
      flex-shrink: 0;
    }

    .skeleton-section {
      padding-bottom: var(--space-lg);
      margin-bottom: var(--space-lg);
      border-bottom: 1px solid var(--border-subtle);
    }

    .skeleton-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: var(--space-lg);
    }

    @media (max-width: 767px) {
      .skeleton-grid {
        grid-template-columns: 1fr;
      }
    }

    @keyframes skeleton-pulse {
      0%, 100% {
        background-color: var(--bg-secondary);
      }
      50% {
        background-color: var(--bg-hover);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton-card,
      .skeleton-detail,
      .skeleton-line {
        animation: none;
        opacity: 0.6;
      }
    }
  `;

  document.head.appendChild(style);
  console.log('✓ T8: Skeleton loader styles injected');
}

/**
 * Simulate async loading with skeleton
 * Useful for testing/demo
 */
export async function simulateLoadWithSkeleton(container, delayMs = 2000, type = 'card') {
  showSkeletonLoader(container, type);
  await new Promise(resolve => setTimeout(resolve, delayMs));
  // Content will be replaced by caller
  console.log(`Skeleton loading complete (${delayMs}ms)`);
}

// Initialize skeleton styles on module load
injectSkeletonStyles();
