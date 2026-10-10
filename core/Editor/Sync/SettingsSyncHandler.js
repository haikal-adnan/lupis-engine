export class SettingsSyncHandler {
    constructor(syncContext) {
        this.ctx = syncContext;
    }

    onUpdateTheme(payload) {
        const { isDark } = payload;
        if (this.ctx.game.rulers) {
            this.ctx.game.rulers.updateColors(isDark);
        }
        if (this.ctx.world.settings?.ui) {
            this.ctx.world.settings.ui.isDarkMode = isDark;
        }
    }

    onUpdateProjectSettings(payload) {
        if (!this.ctx.world.settings) return;

        if (payload.grid) Object.assign(this.ctx.world.settings.grid, payload.grid);
        if (payload.ui) {
            if (!this.ctx.world.settings.ui) this.ctx.world.settings.ui = {};
            Object.assign(this.ctx.world.settings.ui, payload.ui);
        }
        if (payload.camera) {
            if (!this.ctx.world.settings.camera) this.ctx.world.settings.camera = {};
            Object.assign(this.ctx.world.settings.camera, payload.camera);
        }
        if (payload.tickRate !== undefined) {
            this.ctx.world.settings.tickRate = payload.tickRate;
        }
    }

    onUpdateSceneSettings(payload) {
        if (!this.ctx.world.settings) return;

        if (payload.physics) Object.assign(this.ctx.world.settings.physics, payload.physics);
        if (payload.worldBounds) Object.assign(this.ctx.world.settings.worldBounds, payload.worldBounds);
        if (payload.backgroundColor !== undefined) this.ctx.world.settings.backgroundColor = payload.backgroundColor;
        if (payload.showRulers !== undefined) this.ctx.world.settings.showRulers = payload.showRulers;
    }

    onUpdateEditorStore(payload) {
        if (!payload) return;

        if (!this.ctx.world._editors) {
            this.ctx.world._editors = { activeTool: null, activeTabId: null, tilemapContext: {} };
        }

        const { tilemapContext, tileSelection, gridContext, showUIBorder, ...others } = payload;
        Object.assign(this.ctx.world._editors, others);

        if (tilemapContext) {
            if (!this.ctx.world._editors.tilemapContext) this.ctx.world._editors.tilemapContext = {};
            Object.assign(this.ctx.world._editors.tilemapContext, tilemapContext);
        }

        if (tileSelection !== undefined) {
            this.ctx.world._editors.tileSelection = tileSelection;
        }
    }

    onClearSelection() {
        if (this.ctx.game.selection) this.ctx.game.selection.clear();
    }
}