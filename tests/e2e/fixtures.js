import { test as base, expect } from '@playwright/test';
import { BaseControlHelper } from './helpers/BaseControlHelper.js';
import { PopupHelper } from './helpers/PopupHelper.js';
import { HierarchyPage } from './pages/HierarchyPage.js';
import { AssetPanelPage } from './pages/AssetPanelPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { InspectorPage } from './pages/InspectorPage.js';
import { PrefabPage } from './pages/PrefabPage.js';
import { ScriptPanelPage } from './pages/ScriptPanelPage.js';
import { AnimatorPage } from './pages/AnimatorPage.js';
import { VariablePage } from './pages/VariablePage.js';
import { NodeGraphPage } from './pages/NodeGraphPage.js';
import { NodeInspectorPage } from './pages/NodeInspectorPage.js';
import { PreviewPage } from './pages/PreviewPage.js';
import { SettingsModalPage } from './pages/SettingsModalPage.js';

import { VariableCrudObject } from './flows/variables.js';
import { InspectorCrudObject } from './flows/inspector.js';
import { HierarchyCrudObject } from './flows/hierarchy.js';
import { PrefabCrudObject } from './flows/prefabs.js';
import { ScriptCrudObject } from './flows/scripts.js';
import { AssetCrudObject } from './flows/assets.js';
import { AnimatorCrudObject } from './flows/animator.js';
import { NodeGraphCrudObject } from './flows/nodeGraph.js';
import { NodeInspectorCrudObject } from './flows/nodeInspector.js';
import { ensureProject } from './flows/dashboard.js';

import { BlueprintTestRunner } from './flows/blueprint.js';

export const test = base.extend({
  // Disable CSS animations and transitions so E2E runs stay deterministic
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.id = 'disable-e2e-animations';
        style.innerHTML = `
          *, *::before, *::after {
            transition: none !important;
            animation: none !important;
          }
        `;
        document.head.appendChild(style);
      });
    });
    await use(page);
  },

  projectOptions: [
    { prefix: 'E2E', description: 'Isolated workspace for E2E testing' },
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

  animatorPage: async ({ page, project }, use) => {
    await use(new AnimatorPage(page));
  },

  variablePage: async ({ page, project }, use) => {
    await use(new VariablePage(page));
  },

  nodeGraph: async ({ page, project }, use) => {
    await use(new NodeGraphPage(page));
  },

  previewPage: async ({ page, project }, use) => {
    await use(new PreviewPage(page));
  },

  settingsModal: async ({ page, project }, use) => {
    await use(new SettingsModalPage(page));
  },

  // nodeLibrary is an alias of the nodeGraph page object (they were merged into one)
  nodeLibrary: async ({ nodeGraph }, use) => {
    await use(nodeGraph);
  },

  nodeInspector: async ({ page, project }, use) => {
    await use(new NodeInspectorPage(page));
  },

  hierarchyCrud: async ({ page, project }, use) => {
    await use(new HierarchyCrudObject(page));
  },

  prefabCrud: async ({ page, project }, use) => {
    await use(new PrefabCrudObject(page));
  },

  scriptCrud: async ({ page, project }, use) => {
    await use(new ScriptCrudObject(page));
  },

  assetCrud: async ({ page, project }, use) => {
    await use(new AssetCrudObject(page));
  },

  inspector: async ({ page, project }, use) => {
    await use(new InspectorPage(page));
  },

  inspectorCrud: async ({ page, project }, use) => {
    await use(new InspectorCrudObject(page));
  },

  animatorCrud: async ({ page, project }, use) => {
    await use(new AnimatorCrudObject(page));
  },

  variableCrud: async ({ page, project }, use) => {
    await use(new VariableCrudObject(page));
  },

  nodeGraphCrud: async ({ page, project }, use) => {
    await use(new NodeGraphCrudObject(page));
  },

  nodeInspectorCrud: async ({ page, project }, use) => {
    await use(new NodeInspectorCrudObject(page));
  },

  blueprintRunner: async ({ page, nodeGraphCrud, nodeGraph, variableCrud, nodeInspectorCrud, previewPage, popup }, use) => {
    const runner = new BlueprintTestRunner({
      page,
      nodeGraphCrud,
      nodeGraph,
      variableCrud,
      nodeInspectorCrud,
      previewPage,
      popup,
    });
    await use(runner);
  },
});

export { expect };