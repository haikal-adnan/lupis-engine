import { expect } from '@playwright/test';

const CHANNEL_NAME = 'lupis_engine_preview_channel';

export class PreviewPage {
    /** @param {import('@playwright/test').Page} page */
    constructor(page) {
        this.page = page;
    }

    get playButton() {
        return this.page.getByTestId('viewport-overlay-play-button');
    }

      /** Mulai merekam log engine yang disiarkan preview ke editor. Panggil SEBELUM klik Play. */
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

    collectPopupConsole(popup) {
        const messages = [];
        popup.on('console', (msg) => messages.push({ type: msg.type(), text: msg.text() }));
        return messages;
        }

    async dumpRuntimeState(popup) {
        return await popup.evaluate(() => {
            const game = window.$game;
            if (!game) return { error: 'window.$game tidak tersedia' };

            const scripts = Object.values(game.world?.scripts ?? {});
            const typeById = {};
            scripts.forEach((s) => (s.nodes ?? []).forEach((n) => (typeById[n.id] = n.type)));

            const entries = game.scriptSystem?.runners ?? [];

            return {
            hasStarted: game.hasStarted,
            nodes: scripts.flatMap((s) =>
                (s.nodes ?? []).map((n) => ({
                type: n.type,
                hasCode: typeof n.data?.code === 'string' && n.data.code.length > 0,
                codeHead: n.data?.code?.slice(0, 50) ?? null,
                inputs: (n.inputs ?? []).map((p) => `${p.id}:${p.dataType}`),
                outputs: (n.outputs ?? []).map((p) => `${p.id}:${p.dataType}`),
                })),
            ),
            edges: scripts.flatMap((s) =>
                (s.edges ?? []).map((e) => ({
                from: `${typeById[e.source]}.${e.sourceHandle}`,
                to: `${typeById[e.target]}.${e.targetHandle}`,
                })),
            ),
            runners: entries.map((entry) => {
                const r = entry.runner ?? entry;
                return {
                entryKeys: Object.keys(entry),
                compiledCount: r._compiledFunctions?.size ?? null,
                registeredEvents: r._registeredEvents?.length ?? null,
                hasOwner: !!r.owner,
                active: r._isScriptActive?.() ?? null,
                };
            }),
            };
        });
        }

    async getScenePayloadSummary() {
        return await this.page.evaluate(() => {
            const p = window.__previewScenePayload;
            if (!p) return null;

            const scripts = Array.isArray(p.scripts) ? p.scripts : Object.values(p.scripts ?? {});
            const scenesJson = JSON.stringify(p.scenes ?? []);

            return {
            scripts: scripts.map((s) => ({
                id: s.id,
                name: s.name,
                nodeTypes: (s.nodes ?? []).map((n) => n.type),
                edgeCount: (s.edges ?? []).length,
                referencedByScene: scenesJson.includes(s.id),
            })),
            };
        });
    }

    async expectScriptInPayload(scriptName, { nodeTypes, edgeCount }) {
        await expect
        .poll(async () => (await this.getScenePayloadSummary())?.scripts.find((s) => s.name === scriptName), {
        message: `Payload preview harus memuat script "${scriptName}" lengkap dengan node & edge`,
        })
        .toMatchObject({
        nodeTypes: expect.arrayContaining(nodeTypes),
        edgeCount,
        referencedByScene: true,
        });
    }

  async getLogs() {
    return await this.page.evaluate(() => window.__previewLogs ?? []);
  }

  async expectPreviewing(expected = true) {
    await expect(this.playButton).toHaveAttribute('aria-pressed', String(expected));
    }

  async openPreview() {
    await expect(this.playButton).toBeVisible();
    const [popup] = await Promise.all([
      this.page.waitForEvent('popup'),
      this.playButton.click(),
    ]);
    await popup.waitForLoadState('domcontentloaded');
    return popup;
  }

  /** Tunggu sampai engine di popup selesai boot (loading overlay disembunyikan). */
  async expectEngineReady(popup) {
    await expect(popup.getByTestId('preview-canvas')).toBeVisible();
    await expect(popup.getByTestId('preview-loading')).toBeHidden({ timeout: 30_000 });
  }

  async expectLog(message, source) {
    await expect
      .poll(async () => await this.getLogs(), {
        message: `Menunggu log "${message}" dari preview`,
        timeout: 15_000,
      })
      .toContainEqual(
        expect.objectContaining({ message, ...(source ? { source } : {}) }),
      );
  }

  collectPopupErrors(popup) {
    const errors = [];
    popup.on('pageerror', (err) => errors.push(err.message));
    return errors;
  }
}