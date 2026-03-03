/**
 * Shared Utilities — Common functions used across views
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Renders an object as nested HTML list
 * @param {object} obj - Object to render
 * @param {number} depth - Current nesting depth
 * @returns {string} HTML string
 */
export function renderObj(obj, depth = 0) {
  let html = '<ul style="list-style:none;padding-left:' + (depth * 12) + 'px;">'
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      html += `<li><strong style="color:var(--text-accent);">${fmtKey(key)}:</strong></li>`
      value.forEach(item => {
        html += typeof item === 'object' ? `<li>${renderObj(item, depth + 1)}</li>` : `<li style="padding-left:12px;">• ${item}</li>`
      })
    } else if (typeof value === 'object' && value !== null) {
      html += `<li><strong style="color:var(--text-accent);">${fmtKey(key)}:</strong></li>${renderObj(value, depth + 1)}`
    } else {
      html += `<li><strong style="color:var(--text-accent);">${fmtKey(key)}:</strong> ${value}</li>`
    }
  }
  return html + '</ul>'
}

/**
 * Formats object key for display (converts camelCase to Title Case)
 * @param {string} k - Key to format
 * @returns {string} Formatted key
 */
function fmtKey(k) {
  return k
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

/**
 * Sanitize user input by removing control characters and limiting length
 * AC-3: Remove control chars (\x00-\x1F except \n\t) and truncate to maxLen
 *
 * @param {string} str - String to sanitize
 * @param {number} maxLen - Maximum length (default 500)
 * @returns {string} Sanitized string
 */
export function sanitizeInput(str, maxLen = 500) {
  if (typeof str !== 'string') return ''

  // Remove control characters except newline and tab
  // eslint-disable-next-line no-control-regex
  let sanitized = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')

  // Truncate to max length
  if (sanitized.length > maxLen) {
    sanitized = sanitized.substring(0, maxLen)
  }

  return sanitized
}
