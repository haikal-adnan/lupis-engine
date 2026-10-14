// ESLint flat config that enforces the E2E Testing Standard (Section 13).
// Requires: npm i -D eslint eslint-plugin-playwright
import playwright from 'eslint-plugin-playwright';

export default [
  {
    files: ['e2e/**/*.js'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/no-nth-methods': 'error',
      'playwright/no-conditional-in-test': 'error',
      'playwright/missing-playwright-await': 'error',
      'playwright/no-useless-not': 'error',
      'playwright/expect-expect': [
        'error',
          {
            assertFunctionNames: ['expect', 'blueprintRunner.runTest', 'runTest'],
          },
        ],
    },
  },

  // Page Objects and helpers may use .first() where Section 4.4 / 7.5(d) justifies it
  // (e.g. .locator('input').first() inside a test-ID wrapper), and conditionals inside
  // classes are not test bodies, so these rules only apply to specs.
  {
    files: ['e2e/helpers/**/*.js', 'e2e/pages/**/*.js', 'e2e/flows/**/*.js', 'e2e/fixtures.js'],
    rules: {
      'playwright/no-nth-methods': 'off',
      'playwright/no-conditional-in-test': 'off',
      'playwright/expect-expect': 'off',
    },
  },

  // Section 4.5: one-way dependency direction  spec -> fixtures/flows -> pages -> helpers
  {
    files: ['e2e/helpers/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['**/pages/*', '**/flows/*', '**/specs/*'], message: 'helpers/ must not import pages/flows/specs (Section 4.5).' },
      ] }],
    },
  },
  {
    files: ['e2e/pages/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['**/flows/*', '**/specs/*', '**/fixtures.js'], message: 'pages/ may only import helpers/ (Section 4.5).' },
      ] }],
    },
  },
  {
    files: ['e2e/flows/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['**/specs/*', '**/fixtures.js'], message: 'flows/ may only import pages/ and helpers/ (Section 4.5).' },
      ] }],
    },
  },
  {
    // Specs must import test/expect from fixtures.js, never from Playwright directly (Section 2 / 4.6)
    files: ['e2e/specs/**/*.js', 'e2e/contract/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: '@playwright/test', message: "Import { test, expect } from '../fixtures.js' (Section 4.6)." }],
        patterns: [{ group: ['**/helpers/*', '**/pages/*'], message: 'Specs get helpers/pages through fixtures, not direct imports (Section 4.5).' }],
      }],
    },
  },
];
