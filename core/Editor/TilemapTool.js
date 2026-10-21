import { TilemapMath } from './Tilemap/TilemapMath.js';
import { TilemapOperations } from './Tilemap/TilemapOperations.js';
import { TilemapSelection } from './Tilemap/TilemapSelection.js';

export default class TilemapTool {
    constructor(game) {
        this.game = game;
        this.world = game?.world;
        this.input = game?.input;
        this.camera = game?.camera;

        this.operations = new TilemapOperations();
        this.selection = new TilemapSelection(this.operations);

        this._isPanning = false;
        this._lastPanPos = { x: 0, y: 0 };
    }

    update() {
        const editors = this.world?._editors;
        if (!editors) return;

        const activeTool = editors.activeTool || 'select';
        const activeId = editors.activeTabId;
        const entity = TilemapMath.findEntity(this.world, activeId);

        // Right click or Escape to cancel selection / move
        if (this.input?.mouse?.isDown(2) || this.input?.keyboard?.isPressed('Escape')) {
            if (this.operations?.activeStroke) {
                const initData = this.operations.activeStroke.initialData;
                this.operations.activeStroke = null;
                if (initData && entity?.components?.Tilemap) {
                    this.operations.applyDataChange(entity, entity.components.Tilemap, initData);
                }
            }
            this._resetState(editors);
            return;
        }

        // Mode Hand / Spacebar Panning
        if (activeTool === 'hand' || this.input?.keyboard?.isDown('Space')) {
            this._handlePan();
            return;
        }

        if (!entity?.components?.Tilemap) return;
        const tm = entity.components.Tilemap;
        const gridPos = TilemapMath.getMouseGridPosition(this.game, entity, tm);

        // Delete / Backspace to clear marquee area or dragged tiles
        if (this.input?.keyboard?.isPressed('Delete') || this.input?.keyboard?.isPressed('Backspace')) {
            if (editors.dragState) {
                const ds = editors.dragState;
                this.operations.deleteArea(entity, tm, ds.sourceX, ds.sourceY, ds.w, ds.h);
                this._resetState(editors);
                return;
            }
            if (editors.marqueeSelection) {
                const ms = editors.marqueeSelection;
                this.operations.deleteArea(entity, tm, ms.x, ms.y, ms.w, ms.h);
                editors.marqueeSelection = null;
                return;
            }
        }

        const isCtrlDown = Boolean(
            this.input?.keyboard?.isDown?.('Control') || 
            this.input?.keyboard?.isDown?.('Meta') || 
            this.input?.keyboard?.ctrl
        );

        // --- IF CARRYING DRAG STATE OR SELECT TOOL / CTRL PRESSED ---
        if (editors.dragState || activeTool === 'select' || (isCtrlDown && activeTool !== 'eraser')) {
            this.selection.handleSelectionAndMove(this.input, entity, tm, gridPos, editors, isCtrlDown);
            return;
        }

        // --- ERASER TOOL ---
        if (activeTool === 'eraser') {
            this.selection.handleEraser(this.input, entity, tm, gridPos, editors);
            return;
        }

        if (editors.dragState) this._resetState(editors);

        // Clear marquee when painting normally without Ctrl
        if (this.input?.mouse?.isPressed?.(0) && !isCtrlDown) {
            editors.marqueeSelection = null;
        }

        // --- BRUSH / BUCKET / EYEDROPPER ---
        if (this.input?.mouse?.isDown(0)) {
            if (gridPos) {
                switch (activeTool) {
                    case 'brush':
                        if (editors.tileSelection) {
                            this.operations.startStroke(entity, tm, 'Paint');
                            this.operations.paint(this.world, entity, tm, gridPos.x, gridPos.y, tm.assetId, editors.tileSelection, false);
                        }
                        break;
                    case 'bucket':
                        if (editors.tileSelection) {
                            this.operations.handleBucket(this.world, entity, tm, gridPos.x, gridPos.y, editors.tileSelection);
                        }
                        break;
                    case 'eyedropper':
                        this.operations.handleEyedropper(this.world, tm, gridPos.x, gridPos.y);
                        break;
                }
            }
        } else {
            this.operations.endStroke(entity, tm);
        }
    }

    _resetState(editors) {
        this._isPanning = false;
        if (this.operations) {
            this.operations.activeStroke = null;
        }
        this.selection.reset(editors);
    }

    _handlePan() {
        if (this.input?.mouse?.isDown(0)) {
            if (!this._isPanning) {
                this._isPanning = true;
                this._lastPanPos = { x: this.input.mouse.x, y: this.input.mouse.y };
            } else {
                const dx = this.input.mouse.x - this._lastPanPos.x;
                const dy = this.input.mouse.y - this._lastPanPos.y;
                const camScale = Math.max(0.001, this.camera?.scale || 1);
                this.camera.x -= dx / camScale;
                this.camera.y -= dy / camScale;
                this._lastPanPos = { x: this.input.mouse.x, y: this.input.mouse.y };
            }
        } else {
            this._isPanning = false;
        }
    }
}