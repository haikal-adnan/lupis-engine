export class TilemapSelection {
    constructor(operations) {
        this.operations = operations;
        this.mouseDownPos = null;
        this.isWaitingForDrop = false;
        this.lockSelection = false;
    }

    reset(editors) {
        this.mouseDownPos = null;
        this.isWaitingForDrop = false;
        this.lockSelection = false;
        if (editors) {
            editors.dragState = null;
            editors.marqueeSelection = null;
        }
    }

    handleEraser(input, entity, tm, gridPos, editors) {
        const isMouseDown = Boolean(input?.mouse?.isDown(0));
        const isCtrl = Boolean(input?.keyboard?.ctrl);

        if (!isMouseDown) {
            if (editors.marqueeSelection && this.mouseDownPos) {
                const ms = editors.marqueeSelection;
                this.operations.paint(entity.world, entity, tm, ms.x, ms.y, tm.assetId, { x: 0, y: 0, w: ms.w, h: ms.h }, true);
                editors.marqueeSelection = null;
            }
            this.mouseDownPos = null;
            return;
        }

        if (gridPos) {
            if (isCtrl || editors.marqueeSelection) {
                if (!this.mouseDownPos) {
                    this.mouseDownPos = { ...gridPos };
                }

                const x = Math.min(this.mouseDownPos.x, gridPos.x);
                const y = Math.min(this.mouseDownPos.y, gridPos.y);
                const w = Math.abs(gridPos.x - this.mouseDownPos.x) + 1;
                const h = Math.abs(gridPos.y - this.mouseDownPos.y) + 1;

                editors.marqueeSelection = { x, y, w, h };
            } else {
                this.operations.paint(entity.world, entity, tm, gridPos.x, gridPos.y, tm.assetId, { x: 0, y: 0, w: 1, h: 1 }, true);
                this.mouseDownPos = null;
            }
        }
    }

    handleSelectionAndMove(input, entity, tm, gridPos, editors) {
        const isMouseDown = Boolean(input?.mouse?.isDown(0));

        if (!isMouseDown) {
            this.lockSelection = false;
        }

        if (!gridPos || this.lockSelection) {
            if (!isMouseDown) this.mouseDownPos = null;
            return;
        }

        const isCtrl = Boolean(input?.keyboard?.ctrl);

        if (isMouseDown && !this.mouseDownPos && !editors.dragState) {
            this.mouseDownPos = { ...gridPos };
            return;
        }

        if (isMouseDown && this.mouseDownPos && !editors.dragState) {
            const hasMoved = this.mouseDownPos.x !== gridPos.x || this.mouseDownPos.y !== gridPos.y;

            if (isCtrl) {
                const x = Math.min(this.mouseDownPos.x, gridPos.x);
                const y = Math.min(this.mouseDownPos.y, gridPos.y);
                const w = Math.abs(gridPos.x - this.mouseDownPos.x) + 1;
                const h = Math.abs(gridPos.y - this.mouseDownPos.y) + 1;
                editors.marqueeSelection = { x, y, w, h };
            } else if (hasMoved) {
                const idx = this.mouseDownPos.y * tm.width + this.mouseDownPos.x;
                const tileId = tm.data ? tm.data[idx] : 0;

                if (tileId !== 0) {
                    editors.dragState = {
                        data: [tileId],
                        w: 1,
                        h: 1,
                        sourceX: this.mouseDownPos.x,
                        sourceY: this.mouseDownPos.y,
                        offX: 0,
                        offY: 0
                    };
                    this.isWaitingForDrop = false;
                }
            }
            return;
        }

        if (!isMouseDown && this.mouseDownPos) {
            if (editors.marqueeSelection) {
                const ms = editors.marqueeSelection;
                const offX = gridPos.x - ms.x;
                const offY = gridPos.y - ms.y;

                const capturedData = [];
                let hasContent = false;
                for (let dy = 0; dy < ms.h; dy++) {
                    for (let dx = 0; dx < ms.w; dx++) {
                        const idx = (ms.y + dy) * tm.width + (ms.x + dx);
                        const id = tm.data ? tm.data[idx] : 0;
                        capturedData.push(id);
                        if (id !== 0) hasContent = true;
                    }
                }

                if (hasContent) {
                    editors.dragState = {
                        data: capturedData,
                        w: ms.w,
                        h: ms.h,
                        sourceX: ms.x,
                        sourceY: ms.y,
                        offX: offX,
                        offY: offY
                    };
                    this.isWaitingForDrop = true;
                }
                editors.marqueeSelection = null;
            } else if (!editors.dragState) {
                const idx = this.mouseDownPos.y * tm.width + this.mouseDownPos.x;
                const tileId = tm.data ? tm.data[idx] : 0;
                if (tileId !== 0) {
                    editors.dragState = {
                        data: [tileId],
                        w: 1,
                        h: 1,
                        sourceX: this.mouseDownPos.x,
                        sourceY: this.mouseDownPos.y,
                        offX: 0,
                        offY: 0
                    };
                    this.isWaitingForDrop = true;
                }
            } else if (editors.dragState && !this.isWaitingForDrop) {
                const ds = editors.dragState;
                this.commitMove(entity, tm, ds, gridPos.x, gridPos.y);
                this.reset(editors);
                this.lockSelection = true;
            }

            this.mouseDownPos = null;
            return;
        }

        if (isMouseDown && editors.dragState && this.isWaitingForDrop && !this.mouseDownPos) {
            const ds = editors.dragState;
            const targetX = gridPos.x - (ds.offX || 0);
            const targetY = gridPos.y - (ds.offY || 0);

            this.commitMove(entity, tm, ds, targetX, targetY);
            this.reset(editors);
            this.lockSelection = true;
        }
    }

    commitMove(entity, tm, dragState, targetX, targetY) {
        if (!dragState || !tm.data) return;
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
        this.operations.applyDataChange(entity, tm, newData);
    }
}