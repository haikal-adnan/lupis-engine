export class TilemapSelection {
    constructor(operations) {
        this.operations = operations;
        this.mouseDownPos = null;
        this.isWaitingForDrop = false;
        this.lockSelection = false;
        this.isSelecting = false;
        this.startGridPos = null;
    }

    reset(editors) {
        this.mouseDownPos = null;
        this.isWaitingForDrop = false;
        this.lockSelection = false;
        this.isSelecting = false;
        this.startGridPos = null;
        if (editors) {
            editors.dragState = null;
            editors.marqueeSelection = null;
        }
    }

    handleEraser(input, entity, tm, gridPos, editors) {
        const isMouseDown = Boolean(input?.mouse?.isDown(0));
        const isCtrl = Boolean(
            input?.keyboard?.isDown?.('Control') || 
            input?.keyboard?.isDown?.('Meta') || 
            input?.keyboard?.ctrl
        );

        if (!isMouseDown) {
            if (editors.marqueeSelection && this.mouseDownPos) {
                const ms = editors.marqueeSelection;
                this.operations.deleteArea(entity, tm, ms.x, ms.y, ms.w, ms.h);
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
                this.operations.paint(
                    entity.world, 
                    entity, 
                    tm, 
                    gridPos.x, 
                    gridPos.y, 
                    tm.assetId, 
                    { x: 0, y: 0, w: 1, h: 1 }, 
                    true
                );
                this.mouseDownPos = null;
            }
        }
    }

    handleSelectionAndMove(input, entity, tm, gridPos, editors, isCtrlDown = false) {
        if (!gridPos || !input || !editors) return;

        const isMouseDown = Boolean(input.mouse?.isDown(0));

        if (!isMouseDown) {
            this.lockSelection = false;
        }

        if (this.lockSelection) {
            if (!isMouseDown) this.mouseDownPos = null;
            return;
        }

        // --- FASE 1: MENJATUHKAN / DROP TILE (Jika sedang membawa dragState) ---
        if (editors.dragState) {
            if (isMouseDown && !this.mouseDownPos) {
                const ds = editors.dragState;
                const targetX = gridPos.x - (ds.offX || 0);
                const targetY = gridPos.y - (ds.offY || 0);

                this.commitMove(entity, tm, ds, targetX, targetY);
                this.reset(editors);
                this.lockSelection = true;
            }
            return;
        }

        // --- FASE 2: MULAI DRAG PADA GRID ---
        if (isMouseDown && !this.mouseDownPos) {
            this.mouseDownPos = { ...gridPos };
            return;
        }

        // --- FASE 3: MEMPERBARUI MARQUEE BOX SAAT MOUSE DITARIK ---
        if (isMouseDown && this.mouseDownPos) {
            const x = Math.min(this.mouseDownPos.x, gridPos.x);
            const y = Math.min(this.mouseDownPos.y, gridPos.y);
            const w = Math.abs(gridPos.x - this.mouseDownPos.x) + 1;
            const h = Math.abs(gridPos.y - this.mouseDownPos.y) + 1;

            editors.marqueeSelection = { x, y, w, h };
            return;
        }

        // --- FASE 4: SAAT KLIK DILEPAS (MOUSE UP) -> TANGKAP TILE MENJADI DRAG STATE ---
        if (!isMouseDown && this.mouseDownPos) {
            if (editors.marqueeSelection) {
                const ms = editors.marqueeSelection;
                const offX = gridPos.x - ms.x;
                const offY = gridPos.y - ms.y;

                const capturedData = [];
                let hasContent = false;

                for (let dy = 0; dy < ms.h; dy++) {
                    for (let dx = 0; dx < ms.w; dx++) {
                        const key = `${ms.x + dx},${ms.y + dy}`;
                        const tileId = tm.data ? (tm.data[key] || 0) : 0;
                        capturedData.push(tileId);
                        if (tileId > 0) hasContent = true;
                    }
                }

                if (hasContent) {
                    editors.dragState = {
                        data: capturedData,
                        w: ms.w,
                        h: ms.h,
                        sourceX: ms.x,
                        sourceY: ms.y,
                        offX: Math.max(0, Math.min(ms.w - 1, offX)),
                        offY: Math.max(0, Math.min(ms.h - 1, offY))
                    };
                }
                editors.marqueeSelection = null;
            } else {
                const key = `${this.mouseDownPos.x},${this.mouseDownPos.y}`;
                const tileId = tm.data ? (tm.data[key] || 0) : 0;
                if (tileId > 0) {
                    editors.dragState = {
                        data: [tileId],
                        w: 1,
                        h: 1,
                        sourceX: this.mouseDownPos.x,
                        sourceY: this.mouseDownPos.y,
                        offX: 0,
                        offY: 0
                    };
                }
            }

            this.mouseDownPos = null;
        }
    }

    commitMove(entity, tm, dragState, targetX, targetY) {
        if (!dragState || !tm.data) return;
        if (dragState.sourceX === targetX && dragState.sourceY === targetY) return;

        const newData = { ...tm.data };

        // 1. Hapus tile dari lokasi awal
        for (let dy = 0; dy < dragState.h; dy++) {
            for (let dx = 0; dx < dragState.w; dx++) {
                const srcKey = `${dragState.sourceX + dx},${dragState.sourceY + dy}`;
                delete newData[srcKey];
            }
        }

        // 2. Tulis tile ke lokasi tujuan baru
        for (let dy = 0; dy < dragState.h; dy++) {
            for (let dx = 0; dx < dragState.w; dx++) {
                const tx = targetX + dx;
                const ty = targetY + dy;
                const tileId = dragState.data[dy * dragState.w + dx];
                const dstKey = `${tx},${ty}`;
                if (tileId !== 0) {
                    newData[dstKey] = tileId;
                }
            }
        }

        this.operations.applyDataChange(entity, tm, newData);
    }
}