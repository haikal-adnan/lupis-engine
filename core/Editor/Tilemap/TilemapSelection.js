export class TilemapSelection {
    constructor(operations) {
        this.operations = operations;
        this.mouseDownPos = null;
        this.isSelecting = false;
        this.isDragging = false;
        this.dragHasMoved = false;
        this.lastGridPos = null;
        this.dragInitialData = null;
    }

    reset(editors) {
        this.mouseDownPos = null;
        this.isSelecting = false;
        this.isDragging = false;
        this.dragHasMoved = false;
        this.lastGridPos = null;
        this.dragInitialData = null;
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
            this.operations.endStroke?.(entity, tm);
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
                this.operations.startStroke?.(entity, tm, 'Erase');
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
        if (!input || !editors) return;

        if (gridPos) {
            this.lastGridPos = { ...gridPos };
        }
        const currentPos = gridPos || this.lastGridPos;
        if (!currentPos) return;

        const isMouseDown = Boolean(input.mouse?.isDown(0));
        const isCtrl = Boolean(
            isCtrlDown ||
            input?.keyboard?.isDown?.('Control') || 
            input?.keyboard?.isDown?.('Meta') || 
            input?.keyboard?.ctrl
        );

        // 1. If currently dragging (single tile or multi-tile marquee)
        if (editors.dragState) {
            if (isMouseDown) {
                const ds = editors.dragState;
                const curTargetX = currentPos.x - (ds.offX || 0);
                const curTargetY = currentPos.y - (ds.offY || 0);
                if (curTargetX !== ds.sourceX || curTargetY !== ds.sourceY) {
                    this.dragHasMoved = true;
                }
                return;
            } else {
                // Mouse released -> drop and commit move
                const ds = editors.dragState;
                const targetX = currentPos.x - (ds.offX || 0);
                const targetY = currentPos.y - (ds.offY || 0);

                if (this.dragHasMoved && (targetX !== ds.sourceX || targetY !== ds.sourceY)) {
                    this.commitMove(entity, tm, ds, targetX, targetY);
                    editors.marqueeSelection = { x: targetX, y: targetY, w: ds.w, h: ds.h };
                } else {
                    editors.marqueeSelection = { x: ds.sourceX, y: ds.sourceY, w: ds.w, h: ds.h };
                }

                editors.dragState = null;
                this.isDragging = false;
                this.dragHasMoved = false;
                this.mouseDownPos = null;
                this.dragInitialData = null;
                return;
            }
        }

        // 2. If currently drawing a marquee selection box
        if (this.isSelecting) {
            if (isMouseDown) {
                if (this.mouseDownPos) {
                    const x = Math.min(this.mouseDownPos.x, currentPos.x);
                    const y = Math.min(this.mouseDownPos.y, currentPos.y);
                    const w = Math.abs(currentPos.x - this.mouseDownPos.x) + 1;
                    const h = Math.abs(currentPos.y - this.mouseDownPos.y) + 1;
                    editors.marqueeSelection = { x, y, w, h };
                }
                return;
            } else {
                // Mouse released -> finalize marquee selection
                this.isSelecting = false;
                this.mouseDownPos = null;

                const ms = editors.marqueeSelection;
                if (ms) {
                    let hasContent = false;
                    if (tm?.data) {
                        for (let dy = 0; dy < ms.h; dy++) {
                            for (let dx = 0; dx < ms.w; dx++) {
                                const key = `${ms.x + dx},${ms.y + dy}`;
                                if (tm.data[key] && tm.data[key] > 0) {
                                    hasContent = true;
                                    break;
                                }
                            }
                            if (hasContent) break;
                        }
                    }
                    if (!hasContent) {
                        editors.marqueeSelection = null;
                    }
                }
                return;
            }
        }

        // 3. Idle state (not dragging and not selecting)
        if (!isMouseDown) {
            this.mouseDownPos = null;
            return;
        }

        // --- MOUSE DOWN OCCURRED ---

        // Check if cursor is inside an existing marquee selection
        const ms = editors.marqueeSelection;
        const isInsideSelection = Boolean(
            ms &&
            currentPos.x >= ms.x && currentPos.x < ms.x + ms.w &&
            currentPos.y >= ms.y && currentPos.y < ms.y + ms.h
        );

        // CASE 1: Marquee creation (ONLY when Ctrl is held down!)
        // This allows starting a marquee even over filled tiles without accidentally moving them
        if (isCtrl) {
            this.isSelecting = true;
            this.mouseDownPos = { ...currentPos };
            editors.marqueeSelection = {
                x: currentPos.x,
                y: currentPos.y,
                w: 1,
                h: 1
            };
            return;
        }

        // CASE 2: Moving existing marquee selection (Ctrl is released and user drags from inside marquee)
        if (isInsideSelection) {
            const capturedData = [];
            let hasContent = false;

            for (let dy = 0; dy < ms.h; dy++) {
                for (let dx = 0; dx < ms.w; dx++) {
                    const key = `${ms.x + dx},${ms.y + dy}`;
                    const tileId = tm?.data ? (tm.data[key] || 0) : 0;
                    capturedData.push(tileId);
                    if (tileId > 0) hasContent = true;
                }
            }

            if (hasContent) {
                const offX = currentPos.x - ms.x;
                const offY = currentPos.y - ms.y;

                this.dragInitialData = { ...tm.data };
                editors.dragState = {
                    data: capturedData,
                    w: ms.w,
                    h: ms.h,
                    sourceX: ms.x,
                    sourceY: ms.y,
                    offX: Math.max(0, Math.min(ms.w - 1, offX)),
                    offY: Math.max(0, Math.min(ms.h - 1, offY))
                };
                editors.marqueeSelection = null;
                this.isDragging = true;
                this.dragHasMoved = false;
                this.mouseDownPos = { ...currentPos };
                return;
            } else {
                editors.marqueeSelection = null;
            }
        }

        // CASE 3: Single tile move / select (Ctrl is released, clicked on a tile directly)
        const currentTileKey = `${currentPos.x},${currentPos.y}`;
        const hasTileAtCurrentPos = Boolean(tm?.data && tm.data[currentTileKey] > 0);

        if (hasTileAtCurrentPos) {
            const tileId = tm.data[currentTileKey];
            editors.marqueeSelection = null;
            this.dragInitialData = { ...tm.data };
            editors.dragState = {
                data: [tileId],
                w: 1,
                h: 1,
                sourceX: currentPos.x,
                sourceY: currentPos.y,
                offX: 0,
                offY: 0
            };
            this.isDragging = true;
            this.dragHasMoved = false;
            this.mouseDownPos = { ...currentPos };
            return;
        }

        // CASE 4: Clicked on empty space without Ctrl -> deselect any active marquee
        editors.marqueeSelection = null;
    }

    commitMove(entity, tm, dragState, targetX, targetY) {
        if (!dragState || !tm.data) return;
        if (dragState.sourceX === targetX && dragState.sourceY === targetY) return;

        const oldData = dragState.initialData || this.dragInitialData || { ...tm.data };
        const newData = { ...tm.data };

        for (let dy = 0; dy < dragState.h; dy++) {
            for (let dx = 0; dx < dragState.w; dx++) {
                const tileId = dragState.data[dy * dragState.w + dx];
                if (tileId > 0) {
                    const srcKey = `${dragState.sourceX + dx},${dragState.sourceY + dy}`;
                    delete newData[srcKey];
                }
            }
        }

        for (let dy = 0; dy < dragState.h; dy++) {
            for (let dx = 0; dx < dragState.w; dx++) {
                const tx = targetX + dx;
                const ty = targetY + dy;
                const tileId = dragState.data[dy * dragState.w + dx];
                if (tileId > 0) {
                    const dstKey = `${tx},${ty}`;
                    newData[dstKey] = tileId;
                }
            }
        }

        const desc = (dragState.w > 1 || dragState.h > 1) ? 'Move Marquee Tiles' : 'Move Tile';
        this.operations.applyDataChange(entity, tm, newData, oldData, desc);
        this.dragInitialData = null;
    }
}