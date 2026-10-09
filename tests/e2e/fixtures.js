import { test as base, expect } from '@playwright/test';
import { BaseControlHelper } from './helpers/BaseControlHelper.js';
import { PopupHelper } from './helpers/PopupHelper.js';
import { HierarchyPage } from './pages/HierarchyPage.js';
import { AssetPanelPage } from './pages/AssetPanelPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { PrefabPage } from './pages/PrefabPage.js';
import { HierarchyCrudObject } from './flows/hierarchy.js';
import { PrefabCrudObject } from './flows/prefabs.js';
import { ensureProject } from './flows/dashboard.js';
import { ScriptPanelPage } from './pages/ScriptPanelPage.js';

export const test = base.extend({
  projectOptions: [
    { prefix: 'E2E', description: 'Workspace isolasi untuk E2E testing' },
    { option: true },
  ],

  isolatedProject: [true, { option: true }],

  project: [
    async ({ page, projectOptions, isolatedProject }, use, testInfo) => {
      if (!isolatedProject) {
        await use(undefined);
        return;
      }
      const result = await ensureProject(page, {
        name: `${projectOptions.prefix} ${testInfo.testId}`,
        description: projectOptions.description,
      });
      await use(result);
    },
    { auto: true },
  ],

  controls: async ({ page }, use) => {
    await use(new BaseControlHelper(page));
  },

  popup: async ({ page }, use) => {
    await use(new PopupHelper(page));
  },

  dashboard: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  hierarchy: async ({ page, project }, use) => {
    await use(new HierarchyPage(page));
  },

  assets: async ({ page, project }, use) => {
    await use(new AssetPanelPage(page));
  },

  prefabs: async ({ page, project }, use) => {
    const prefabPage = new PrefabPage(page);
    await prefabPage.ensureVisible();
    await use(prefabPage);
  },

  scripts: async ({ page, project }, use) => {
    const scriptsPage = new ScriptPanelPage(page);
    await scriptsPage.ensureVisible();
    await use(scriptsPage);
  },

  hierarchyCrud: async ({ page, project }, use) => {
    await use(new HierarchyCrudObject(page));
  },

  prefabCrud: async ({ page, project }, use) => {
    await use(new PrefabCrudObject(page));
  },
});

export { expect };