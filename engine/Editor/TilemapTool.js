import { bus } from '../Util/EventBus.js';

export default class TilemapTool {
    constructor(game) {
        this.game = game;
        this.world = game.world;
        this.input = game.input;
        this.camera = game.camera;

        this._isPanning = false;
        this._lastPanPos = { x: 0, y: 0 };
        this._mouseDownPos = null;
        this._isWaitingForDrop = false;
        this._lockSelection = false;
    }

    update() {
        const editors = this.world._editors;
        if (!editors) return;

        const activeTool = editors.activeTool;
        const activeId = editors.activeTabId;
        const entity = this._findEntity(activeId);

        if (this.input.mouse.isDown(2)) {
            this._resetState(editors);
            return;
        }

        if (activeTool === 'hand' || this.input.keyboard.isDown('Space')) {
            this._handlePan();
            return;
        }

        if (!entity || !entity.components || !entity.components.Tilemap) return;
        const tm = entity.components.Tilemap;
        const gridPos = this._getMouseGridPosition(entity, tm);

        if (activeTool === 'select' || activeTool === 'move') {
            this._handleSelectionAndMove(entity, tm, gridPos, editors);
            return;
        }

        if (activeTool === 'eraser') {
            this._handleEraser(entity, tm, gridPos, editors);
            return;
        }

        if (editors.dragState) this._resetState(editors);

        if (this.input.mouse.isDown(0) && gridPos) {
            switch (activeTool) {
                case 'brush':
                    if (editors.tileSelection) this._paint(entity, tm, gridPos.x, gridPos.y, tm.assetId, editors.tileSelection);
                    break;
                case 'bucket':
                    this._handleBucket(entity, tm, gridPos.x, gridPos.y, editors.tileSelection);
                    break;
                case 'eyedropper':
                    this._handleEyedropper(tm, gridPos.x, gridPos.y);
                    break;
            }
        }
    }

    _handleEraser(entity, tm, gridPos, editors) {
        const isMouseDown = this.input.mouse.isDown(0);
        const isCtrl = this.input.keyboard.ctrl;

        if (!isMouseDown) {
            if (editors.marqueeSelection && this._mouseDownPos) {
                const ms = editors.marqueeSelection;
                this._paint(entity, tm, ms.x, ms.y, tm.assetId, { x: 0, y: 0, w: ms.w, h: ms.h }, true);
                editors.marqueeSelection = null;
            }
            this._mouseDownPos = null;
            return;
        }

        if (gridPos) {
            if (isCtrl || editors.marqueeSelection) {
                if (!this._mouseDownPos) {
                    this._mouseDownPos = { ...gridPos };
                }

                const x = Math.min(this._mouseDownPos.x, gridPos.x);
                const y = Math.min(this._mouseDownPos.y, gridPos.y);
                const w = Math.abs(gridPos.x - this._mouseDownPos.x) + 1;
                const h = Math.abs(gridPos.y - this._mouseDownPos.y) + 1;
                
                editors.marqueeSelection = { x, y, w, h };
            } else {
                this._paint(entity, tm, gridPos.x, gridPos.y, tm.assetId, { x: 0, y: 0, w: 1, h: 1 }, true);
                this._mouseDownPos = null;
            }
        }
    }

    _handleSelectionAndMove(entity, tm, gridPos, editors) {
        const isMouseDown = this.input.mouse.isDown(0);

        if (!isMouseDown) {
            this._lockSelection = false;
        }

        if (!gridPos || this._lockSelection) {
            if (!isMouseDown) this._mouseDownPos = null;
            return;
        }

        const isCtrl = this.input.keyboard.ctrl;

        if (isMouseDown && !this._mouseDownPos && !editors.dragState) {
            this._mouseDownPos = { ...gridPos };
            return;
        }

        if (isMouseDown && this._mouseDownPos && !editors.dragState) {
            const hasMoved = this._mouseDownPos.x !== gridPos.x || this._mouseDownPos.y !== gridPos.y;
            
            if (isCtrl) {
                const x = Math.min(this._mouseDownPos.x, gridPos.x);
                const y = Math.min(this._mouseDownPos.y, gridPos.y);
                const w = Math.abs(gridPos.x - this._mouseDownPos.x) + 1;
                const h = Math.abs(gridPos.y - this._mouseDownPos.y) + 1;
                editors.marqueeSelection = { x, y, w, h };
            } 
            else if (hasMoved) {
                const idx = this._mouseDownPos.y * tm.width + this._mouseDownPos.x;
                const tileId = tm.data[idx];
                
                if (tileId !== 0) {
                    editors.dragState = {
                        data: [tileId],
                        w: 1, h: 1,
                        sourceX: this._mouseDownPos.x,
                        sourceY: this._mouseDownPos.y,
                        offX: 0, offY: 0
                    };
                    this._isWaitingForDrop = false; 
                }
            }
            return;
        }

        if (!isMouseDown && this._mouseDownPos) {
            if (editors.marqueeSelection) {
                const ms = editors.marqueeSelection;
                const offX = gridPos.x - ms.x;
                const offY = gridPos.y - ms.y;

                const capturedData = [];
                let hasContent = false;
                for (let dy = 0; dy < ms.h; dy++) {
                    for (let dx = 0; dx < ms.w; dx++) {
                        const idx = (ms.y + dy) * tm.width + (ms.x + dx);
                        const id = tm.data[idx];
                        capturedData.push(id);
                        if (id !== 0) hasContent = true;
                    }
                }

                if (hasContent) {
                    editors.dragState = {
                        data: capturedData,
                        w: ms.w, h: ms.h,
                        sourceX: ms.x, sourceY: ms.y,
                        offX: offX, offY: offY
                    };
                    this._isWaitingForDrop = true;
                }
                editors.marqueeSelection = null;
            } 
            else if (!editors.dragState) {
                const idx = this._mouseDownPos.y * tm.width + this._mouseDownPos.x;
                const tileId = tm.data[idx];
                if (tileId !== 0) {
                      editors.dragState = {
                        data: [tileId],
                        w: 1, h: 1,
                        sourceX: this._mouseDownPos.x, sourceY: this._mouseDownPos.y,
                        offX: 0, offY: 0
                    };
                    this._isWaitingForDrop = true;
                }
            }
            else if (editors.dragState && !this._isWaitingForDrop) {
                 const ds = editors.dragState;
                 this._commitMove(entity, tm, ds, gridPos.x, gridPos.y);
                 this._resetState(editors);
                 this._lockSelection = true;
            }

            this._mouseDownPos = null;
            return;
        }

        if (isMouseDown && editors.dragState && this._isWaitingForDrop && !this._mouseDownPos) {
            const ds = editors.dragState;
            const targetX = gridPos.x - (ds.offX || 0);
            const targetY = gridPos.y - (ds.offY || 0);

            this._commitMove(entity, tm, ds, targetX, targetY);
            this._resetState(editors);
            this._lockSelection = true;
            return;
        }
    }

    _commitMove(entity, tm, dragState, targetX, targetY) {
        if (dragState.sourceX === targetX && dragState.sourceY === targetY) return;

        const newData = [...tm.data];
        
        for (let dy = 0; dy < dragState.h; dy++) {
            for (let dx = 0; dx < dragState.w; dx++) {
                const srcIdx = (dragState.sourceY + dy) * tm.width + (dragState.sourceX + dx);
                newData[srcIdx] = 0;
            }
        }
        
        for (let dy = 0; dy < dragState.h; dy++) {
            for (let dx = 0; dx < dragState.w; dx++) {
                const tx = targetX + dx;
                const ty = targetY + dy;
                if (tx >= 0 && tx < tm.width && ty >= 0 && ty < tm.height) {
                    const targetIdx = ty * tm.width + tx;
                    const tileId = dragState.data[dy * dragState.w + dx];
                    if (tileId !== 0) newData[targetIdx] = tileId;
                }
            }
        }
        this._applyDataChange(entity, tm, newData);
    }

    _resetState(editors) {
        this._isPanning = false;
        this._mouseDownPos = null;
        this._isWaitingForDrop = false;
        if (editors) {
            editors.dragState = null;
            editors.marqueeSelection = null;
        }
    }

    _paint(entity, tm, gridX, gridY, assetId, selection, isEraser = false) {
        const cols = tm.width;
        const asset = this.world.assets.textures[assetId];
        if (!asset) return;
        const tilesetCols = Math.floor(asset.width / tm.tileWidth);
        const newData = [...tm.data];
        let isChanged = false;
        for (let dy = 0; dy < selection.h; dy++) {
            for (let dx = 0; dx < selection.w; dx++) {
                const tx = gridX + dx;
                const ty = gridY + dy;
                if (tx >= 0 && tx < cols && ty >= 0 && ty < tm.height) {
                    const idx = ty * cols + tx;
                    const tileId = isEraser ? 0 : (selection.y + dy) * tilesetCols + (selection.x + dx) + 1;
                    if (newData[idx] !== tileId) {
                        newData[idx] = tileId;
                        isChanged = true;
                    }
                }
            }
        }
        if (isChanged) this._applyDataChange(entity, tm, newData);
    }

    _handleBucket(entity, tm, gridX, gridY, selection) {
        if (this._blockBucket) return;
        this._blockBucket = true;
        setTimeout(() => this._blockBucket = false, 200);
        const cols = tm.width;
        const rows = tm.height;
        const targetId = tm.data[gridY * cols + gridX];
        const asset = this.world.assets.textures[tm.assetId];
        if (!asset) return;
        const tilesetCols = Math.floor(asset.width / tm.tileWidth);
        const replaceId = (selection.y * tilesetCols) + selection.x + 1;
        if (targetId === replaceId) return;
        const newData = [...tm.data];
        const stack = [{ x: gridX, y: gridY }];
        while (stack.length) {
            const p = stack.pop();
            const idx = p.y * cols + p.x;
            if (newData[idx] === targetId) {
                newData[idx] = replaceId;
                if (p.x > 0) stack.push({ x: p.x - 1, y: p.y });
                if (p.x < cols - 1) stack.push({ x: p.x + 1, y: p.y });
                if (p.y > 0) stack.push({ x: p.x, y: p.y - 1 });
                if (p.y < rows - 1) stack.push({ x: p.x, y: p.y + 1 });
            }
        }
        this._applyDataChange(entity, tm, newData);
    }

    _handleEyedropper(tm, gridX, gridY) {
        const tileId = tm.data[gridY * tm.width + gridX];
        if (tileId === 0) return;
        const asset = this.world.assets.textures[tm.assetId];
        if (!asset) return;
        const tilesetCols = Math.floor(asset.width / tm.tileWidth);
        const id = tileId - 1;
        bus.emit("editor:tool:pickup", { x: id % tilesetCols, y: Math.floor(id / tilesetCols), w: 1, h: 1 });
    }

    _handlePan() {
        if (this.input.mouse.isDown(0)) {
            if (!this._isPanning) {
                this._isPanning = true;
                this._lastPanPos = { x: this.input.mouse.x, y: this.input.mouse.y };
            } else {
                const dx = this.input.mouse.x - this._lastPanPos.x;
                const dy = this.input.mouse.y - this._lastPanPos.y;
                this.camera.x -= dx / this.camera.scale;
                this.camera.y -= dy / this.camera.scale;
                this._lastPanPos = { x: this.input.mouse.x, y: this.input.mouse.y };
            }
        } else this._isPanning = false;
    }

    _applyDataChange(entity, tm, newData) {
        tm.data = newData;
        entity.isDirty = true;
        bus.emit("editor:tilemap:update-data", { entityId: entity.id, newData: newData });
    }

    _getMouseGridPosition(entity, tm) {
        const tf = entity.components.Transform || { x: 0, y: 0, pivotX: 0, pivotY: 0 };
        const canvas = this.game.renderer.canvas;
        const worldX = (this.input.mouse.x - canvas.width / 2) / this.camera.scale + this.camera.x;
        const worldY = (this.input.mouse.y - canvas.height / 2) / this.camera.scale + this.camera.y;
        const startX = tf.x - ((tm.width * tm.tileWidth) * (tf.pivotX ?? 0));
        const startY = tf.y - ((tm.height * tm.tileHeight) * (tf.pivotY ?? 0));
        const gx = Math.floor((worldX - startX) / tm.tileWidth);
        const gy = Math.floor((worldY - startY) / tm.tileHeight);
        return (gx < 0 || gy < 0 || gx >= tm.width || gy >= tm.height) ? null : { x: gx, y: gy };
    }

    _findEntity(activeId) {
        for (const layer of (this.world.layers || [])) {
            for (const e of (layer.entities || [])) {
                if (e.id === activeId) return e;
            }
        }
        return null;
    }
}