import { expect } from '@playwright/test';

const CHANNEL_NAME = 'lupis_engine_preview_channel';

/**
 * Page object for the game preview (editor viewport overlay + the preview popup window).
 *
 * The preview talks to the editor through a BroadcastChannel. Tests only verify that the
 * data received by the editor matches (engine logs, scene payload); they do not test the
 * preview deeper than that.
 */
export class PreviewPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  get playButton() {
    return this.page.getByTestId('viewport-overlay-play-button');
  }

  // ==========================================================================
  // EDITOR-SIDE CAPTURE (BroadcastChannel listener installed in the editor page)
  // ==========================================================================

  /** Starts recording engine logs broadcast by the preview to the editor. Call BEFORE clicking Play. */
  async startLogCapture() {
    await this.page.evaluate((name) => {
      window.__previewChannel?.close();
      window.__previewLogs = [];
      window.__previewScenePayload = null;

      const channel = new BroadcastChannel(name);
      channel.onmessage = (event) => {
        const { type, payload } = event.data ?? {};
        if (type === 'ENGINE_CONSOLE_LOG') window.__previewLogs.push(payload);
        if (type === 'SCENE_UPDATE') window.__previewScenePayload = payload;
      };
      window.__previewChannel = channel;
    }, CHANNEL_NAME);
  }

  async getLogs() {
    return await this.page.evaluate(() => window.__previewLogs ?? []);
  }

  async getScenePayloadSummary() {
    return await this.page.evaluate(() => {
      const payload = window.__previewScenePayload;
      if (!payload) return null;

      const scripts = Array.isArray(payload.scripts) ? payload.scripts : Object.values(payload.scripts ?? {});
      const scenesJson = JSON.stringify(payload.scenes ?? []);

      return {
        scripts: scripts.map((script) => ({
          id: script.id,
          name: script.name,
          nodeTypes: (script.nodes ?? []).map((node) => node.type),
          edgeCount: (script.edges ?? []).length,
          referencedByScene: scenesJson.includes(script.id),
        })),
      };
    });
  }

  /** Asserts the scene payload received by the editor contains the script with its nodes and edges. */
  async expectScriptInPayload(scriptName, { nodeTypes, edgeCount }) {
    await expect
      .poll(async () => (await this.getScenePayloadSummary())?.scripts.find((script) => script.name === scriptName), {
        message: `Preview payload must contain script "${scriptName}" with its nodes and edges`,
      })
      .toMatchObject({
        nodeTypes: expect.arrayContaining(nodeTypes),
        edgeCount,
        referencedByScene: true,
      });
  }

  /**
   * Asserts an engine log was received. Retries through expect.poll with the global
   * expect timeout (no per-call timeout, Section 2).
   */
  async expectLog(message, source) {
    await expect
      .poll(async () => await this.getLogs(), {
        message: `Waiting for log "${message}" from the preview`,
      })
      .toContainEqual(expect.objectContaining({ message, ...(source ? { source } : {}) }));
  }

  async expectPreviewing(expected = true) {
    await expect(this.playButton).toHaveAttribute('aria-pressed', String(expected));
  }

  // ==========================================================================
  // POPUP WINDOW
  // ==========================================================================

  async openPreview() {
    await expect(this.playButton).toBeVisible();
    const [popup] = await Promise.all([this.page.waitForEvent('popup'), this.playButton.click()]);
    await popup.waitForLoadState('domcontentloaded');
    return popup;
  }

  /**
   * Waits until the engine in the popup finished booting (canvas visible, loading overlay hidden).
   * Booting WebGL is slow, so blueprint specs run in the dedicated "blueprint" Playwright project,
   * which has a larger global expect timeout (see playwright.config.js).
   */
  async expectEngineReady(popup) {
    await expect(popup.getByTestId('preview-canvas')).toBeVisible();
    await expect(popup.getByTestId('preview-loading')).toBeHidden();
  }

  // ==========================================================================
  // DIAGNOSTICS (attach on demand while debugging a failing preview test)
  // ==========================================================================

  collectPopupConsole(popup) {
    const messages = [];
    popup.on('console', (msg) => messages.push({ type: msg.type(), text: msg.text() }));
    return messages;
  }

  collectPopupErrors(popup) {
    const errors = [];
    popup.on('pageerror', (err) => errors.push(err.message));
    return errors;
  }

  async dumpRuntimeState(popup) {
    return await popup.evaluate(() => {
      const game = window.$game;
      if (!game) return { error: 'window.$game is not available' };

      const scripts = Object.values(game.world?.scripts ?? {});
      const typeById = {};
      scripts.forEach((script) => (script.nodes ?? []).forEach((node) => (typeById[node.id] = node.type)));

      const entries = game.scriptSystem?.runners ?? [];

      return {
        hasStarted: game.hasStarted,
        nodes: scripts.flatMap((script) =>
          (script.nodes ?? []).map((node) => ({
            type: node.type,
            hasCode: typeof node.data?.code === 'string' && node.data.code.length > 0,
            codeHead: node.data?.code?.slice(0, 50) ?? null,
            inputs: (node.inputs ?? []).map((port) => `${port.id}:${port.dataType}`),
            outputs: (node.outputs ?? []).map((port) => `${port.id}:${port.dataType}`),
          })),
        ),
        edges: scripts.flatMap((script) =>
          (script.edges ?? []).map((edge) => ({
            from: `${typeById[edge.source]}.${edge.sourceHandle}`,
            to: `${typeById[edge.target]}.${edge.targetHandle}`,
          })),
        ),
        runners: entries.map((entry) => {
          const runner = entry.runner ?? entry;
          return {
            entryKeys: Object.keys(entry),
            compiledCount: runner._compiledFunctions?.size ?? null,
            registeredEvents: runner._registeredEvents?.length ?? null,
            hasOwner: !!runner.owner,
            active: runner._isScriptActive?.() ?? null,
          };
        }),
      };
    });
  }
}
