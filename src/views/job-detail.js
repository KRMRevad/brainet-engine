/**
 * Job Detail View - T7: Completo output com back navigation
 * Displays comprehensive job execution details with status, timeline, and output
 */

export function renderJobDetail(jobId, jobData) {
  const container = document.getElementById('job-detail-view');
  if (!container) return;

  // AC-10: Back button with History API guard
  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = '← Back to Jobs';
  backBtn.onclick = () => {
    // T14: History API back navigation (AC-10)
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback: navigate to jobs view
      window.location.hash = '#jobs';
    }
  };

  // Main detail container
  const detail = document.createElement('div');
  detail.className = 'job-detail';

  // Header with job info
  const header = document.createElement('div');
  header.className = 'job-detail-header';

  const titleSection = document.createElement('div');
  titleSection.className = 'job-detail-title';
  titleSection.innerHTML = `
    <h2>${jobData.title || 'Job Details'}</h2>
    <span class="job-status-badge ${jobData.status || 'pending'}">${(jobData.status || 'pending').toUpperCase()}</span>
  `;

  const metaSection = document.createElement('div');
  metaSection.className = 'job-detail-meta';
  metaSection.innerHTML = `
    <div class="job-detail-item">
      <div class="job-detail-label">Job ID</div>
      <div class="job-detail-value">${jobData.id || jobId}</div>
    </div>
    <div class="job-detail-item">
      <div class="job-detail-label">Created At</div>
      <div class="job-detail-value">${new Date(jobData.createdAt || Date.now()).toLocaleString()}</div>
    </div>
    <div class="job-detail-item">
      <div class="job-detail-label">Duration</div>
      <div class="job-detail-value">${jobData.duration || '—'}</div>
    </div>
    <div class="job-detail-item">
      <div class="job-detail-label">Progress</div>
      <div class="job-detail-value">${Math.round((jobData.progress || 0) * 100)}%</div>
    </div>
  `;

  header.appendChild(titleSection);
  header.appendChild(metaSection);
  detail.appendChild(header);

  // Progress bar
  const progressSection = document.createElement('div');
  progressSection.className = 'job-results';
  const progressBar = document.createElement('div');
  progressBar.className = 'job-progress';
  const progressFill = document.createElement('div');
  progressFill.className = 'job-progress-fill';
  progressFill.style.width = `${Math.round((jobData.progress || 0) * 100)}%`;
  progressBar.appendChild(progressFill);
  progressSection.appendChild(progressBar);
  detail.appendChild(progressSection);

  // Job output/results section
  if (jobData.output || jobData.results) {
    const outputSection = document.createElement('div');
    outputSection.className = 'job-results';
    outputSection.innerHTML = `<h3>Output & Results</h3>`;

    const outputContent = document.createElement('div');
    outputContent.style.cssText = `
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      padding: var(--space-md);
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.85rem;
      color: var(--text-secondary);
      max-height: 400px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.6;
    `;
    outputContent.textContent = jobData.output || jobData.results || 'No output yet...';
    outputSection.appendChild(outputContent);
    detail.appendChild(outputSection);
  }

  // Error state (T9: Error states in secondary views)
  if (jobData.status === 'failed' || jobData.error) {
    const errorSection = document.createElement('div');
    errorSection.className = 'job-results';
    errorSection.style.borderLeft = '3px solid var(--color-danger)';
    errorSection.innerHTML = `
      <h3 style="color: var(--color-danger);">⚠️ Error Details</h3>
      <div style="color: var(--text-secondary); font-family: monospace; font-size: 0.85rem; line-height: 1.6;">
        ${jobData.error || 'Unknown error occurred'}
      </div>
    `;
    detail.appendChild(errorSection);
  }

  // Actions
  const actions = document.createElement('div');
  actions.style.cssText = `
    display: flex;
    gap: var(--space-md);
    margin-top: var(--space-lg);
    flex-wrap: wrap;
  `;

  // Retry button (if failed)
  if (jobData.status === 'failed') {
    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn btn-primary';
    retryBtn.textContent = '🔄 Retry Job';
    retryBtn.onclick = () => {
      console.log('Retry job:', jobData.id);
      // T-implement: Retry logic via API
    };
    actions.appendChild(retryBtn);
  }

  // Cancel button (if running)
  if (jobData.status === 'running') {
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-danger';
    cancelBtn.textContent = '⏹️ Cancel Job';
    cancelBtn.onclick = () => {
      if (confirm('Are you sure you want to cancel this job?')) {
        console.log('Cancel job:', jobData.id);
        // T-implement: Cancel logic via API
      }
    };
    actions.appendChild(cancelBtn);
  }

  // Download button
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'btn';
  downloadBtn.textContent = '⬇️ Download Output';
  downloadBtn.onclick = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jobData.output || ''));
    element.setAttribute('download', `job-${jobData.id}-output.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  actions.appendChild(downloadBtn);

  detail.appendChild(actions);

  // Clear and render
  container.innerHTML = '';
  container.appendChild(backBtn);
  container.appendChild(detail);

  // Mark job detail task complete
  console.log(`✓ T7: Job detail view rendered for job ${jobId}`);
}

/**
 * Load job from API and render detail view
 * T7: Fetch and display complete job information
 */
export async function loadAndRenderJobDetail(jobId) {
  try {
    // T-implement: Fetch from /api/jobs/{jobId}
    // For now, using mock data
    const jobData = {
      id: jobId,
      title: 'Content Pipeline Job #' + jobId,
      status: 'completed',
      createdAt: new Date(),
      duration: '4m 23s',
      progress: 1.0,
      output: `Processing started at ${new Date().toISOString()}\n` +
              `Analyzing niche content...\n` +
              `Generated 47 insights\n` +
              `Compiled 12 course modules\n` +
              `Final output: 284KB\n` +
              `Job completed successfully ✓`,
    };

    // Render the detail view
    renderJobDetail(jobId, jobData);

    // T10: History API pushState for navigation (AC-10)
    if (window.history.pushState) {
      window.history.pushState(
        { view: 'job-detail', jobId },
        `Job ${jobId}`,
        `#jobs/${jobId}`
      );
    }
  } catch (error) {
    console.error('Failed to load job detail:', error);
    // T9: Error state rendering
    const container = document.getElementById('job-detail-view');
    if (container) {
      container.innerHTML = `
        <div style="padding: var(--space-lg); text-align: center; color: var(--color-danger);">
          <h2>⚠️ Failed to Load Job</h2>
          <p>${error.message || 'Unknown error occurred'}</p>
          <button class="btn" onclick="window.location.hash = '#jobs'">Back to Jobs</button>
        </div>
      `;
    }
  }
}
