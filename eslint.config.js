import js from '@eslint/js'

// Global rules that apply to all files
const globalRules = {
  ...js.configs.recommended.rules,
  'no-console': 'warn',
  'no-empty': 'warn',
  'prefer-const': 'warn',
  'no-dupe-keys': 'warn',
  // Disable very strict rules that don't apply to existing codebase
  'no-prototype-builtins': 'warn',
  'no-inner-declarations': 'warn',
}

// Remove very strict rules from recommended that aren't needed
delete globalRules['no-undef']

export default [
  // Browser (src/)
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        browser: true,
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        EventSource: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-empty': 'warn',
      'prefer-const': 'warn',
    },
  },
  // Node (server/)
  {
    files: ['server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        node: true,
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'use-y-first': 'off',
      'prefer-promise-reject-errors': 'off',
    },
  },
  // browser-llm.js is hybrid (runs in both browser and node contexts)
  {
    files: ['server/browser-llm.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
      },
    },
    rules: {
      'no-dupe-keys': 'warn',
    },
  },
  // Ignore
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', '.git/**'],
  },
]
