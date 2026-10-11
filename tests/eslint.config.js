// ESLint flat config untuk menegakkan E2E Testing Standard (Section 13).
// Butuh: npm i -D eslint eslint-plugin-playwright
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
      'playwright/expect-expect': 'error',
      'playwright/missing-playwright-await': 'error',
      'playwright/no-useless-not': 'error',
    },
  },

  // Page Object & helper memakai .first() yang dibenarkan Section 4.4 / 7.5(d)
  // (mis. .locator('input').first() di dalam wrapper test ID) dan conditional di dalam
  // class bukan test body, jadi aturan ini hanya berlaku untuk spec.
  {
    files: ['e2e/helpers/**/*.js', 'e2e/pages/**/*.js', 'e2e/flows/**/*.js', 'e2e/fixtures.js'],
    rules: {
      'playwright/no-nth-methods': 'off',
      'playwright/no-conditional-in-test': 'off',
      'playwright/expect-expect': 'off',
    },
  },

  // Section 4.5: arah dependensi satu arah  spec -> fixtures/flows -> pages -> helpers
  {
    files: ['e2e/helpers/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['**/pages/*', '**/flows/*', '**/specs/*'], message: 'helpers/ tidak boleh mengimpor pages/flows/specs (Section 4.5).' },
      ] }],
    },
  },
  {
    files: ['e2e/pages/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['**/flows/*', '**/specs/*', '**/fixtures.js'], message: 'pages/ hanya boleh mengimpor helpers/ (Section 4.5).' },
      ] }],
    },
  },
  {
    files: ['e2e/flows/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['**/specs/*', '**/fixtures.js'], message: 'flows/ hanya boleh mengimpor pages/ dan helpers/ (Section 4.5).' },
      ] }],
    },
  },
  {
    // Spec harus mengimpor test/expect dari fixtures.js, bukan langsung dari Playwright (Section 2 / 4.6)
    files: ['e2e/specs/**/*.js', 'e2e/contract/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: '@playwright/test', message: "Impor { test, expect } dari '../fixtures.js' (Section 4.6)." }],
        patterns: [{ group: ['**/helpers/*', '**/pages/*'], message: 'Spec memakai helper/page lewat fixtures, bukan impor langsung (Section 4.5).' }],
      }],
    },
  },
];
