import { describe, it, expect, vi } from 'vitest';
import { ShapeMath } from '@core/Editor/Shape/ShapeMath.js';
import { TilemapMath } from '@core/System/TilemapSystem/TilemapMath.js';
import { TilemapSelection } from '@core/Editor/Tilemap/TilemapSelection.js';
import { TilemapOperations } from '@core/Editor/Tilemap/TilemapOperations.js';

describe('Shape and Tilemap Math Calculations Unit Tests', () => {
    describe('ShapeMath - Shape Point & Boundary Mathematics', () => {
        const createMockGame = (cameraX = 0, cameraY = 0, cameraScale = 1, mouseX = 960, mouseY = 540) => ({
            camera: { x: cameraX, y: cameraY, scale: cameraScale },
            input: { mouse: { x: mouseX, y: mouseY } },
            renderer: { canvas: { width: 1920, height: 1080 } }
        });

        it('getMouseLocalPosition transforms mouse position into shape local coordinates', () => {
            const entity = {
                components: {
                    Transform: {
                        x: 0, y: 0, width: 100, height: 100,
                        rotation: 0, scaleX: 1, scaleY: 1
                    }
                }
            };

            // Mouse at canvas center (960, 540), camera at (0, 0) -> world position is (0, 0)
            const game = createMockGame(0, 0, 1, 960, 540);
            const localPos = ShapeMath.getMouseLocalPosition(game, entity);

            expect(localPos.x).toBeCloseTo(0);
            expect(localPos.y).toBeCloseTo(0);

            // Mouse moved +50 px in world -> local position in 100x100 entity = +50
            const game2 = createMockGame(0, 0, 1, 1010, 540);
            const localPos2 = ShapeMath.getMouseLocalPosition(game2, entity);
            expect(localPos2.x).toBeCloseTo(50);
            expect(localPos2.y).toBeCloseTo(0);
        });

        it('getHoveredPointId detects points within camera-scaled world radius', () => {
            const elements = [
                { id: 'pt-1', type: 'point', x: 0, y: 0 },
                { id: 'pt-2', type: 'point', x: 50, y: 50 }
            ];
            const entity = {
                components: {
                    Transform: { width: 100, height: 100, scaleX: 1, scaleY: 1 }
                }
            };
            const game = createMockGame(0, 0, 1);

            // Cursor close to pt-1 (radius <= 8px at scale 1)
            const hitId = ShapeMath.getHoveredPointId(game, { x: 3, y: 3 }, elements, entity);
            expect(hitId).toBe('pt-1');

            // Cursor far from both points
            const missId = ShapeMath.getHoveredPointId(game, { x: 25, y: 25 }, elements, entity);
            expect(missId).toBeNull();
        });

        it('getPointsInMarquee filters point IDs inside bounding coordinates', () => {
            const elements = [
                { id: 'p1', type: 'point', x: 10, y: 10 },
                { id: 'p2', type: 'point', x: 25, y: 25 },
                { id: 'p3', type: 'point', x: 80, y: 80 }
            ];

            const selected = ShapeMath.getPointsInMarquee(elements, { x: 0, y: 0 }, { x: 30, y: 30 });
            expect(selected).toEqual(['p1', 'p2']);
        });

        it('recalculateEntityBounds recalculates entity bounds and preserves shape points world positions', () => {
            const entity = {
                components: {
                    Transform: {
                        x: 100, y: 100, width: 100, height: 100,
                        rotation: 0, scaleX: 1, scaleY: 1
                    }
                }
            };
            // Points initially at corners of 100x100
            const shapeComp = {
                elements: [
                    { id: 'p1', type: 'point', x: -50, y: -50 },
                    { id: 'p2', type: 'point', x: 50, y: 50 },
                    { id: 'seg', type: 'segment', points: ['p1', 'p2'] }
                ]
            };

            // Before: center at (100, 100), points span from (-50, -50) to (50, 50)
            ShapeMath.recalculateEntityBounds(entity, shapeComp, false);

            expect(entity.components.Transform.width).toBe(100);
            expect(entity.components.Transform.height).toBe(100);
            expect(entity.components.Transform.x).toBe(100);
            expect(entity.components.Transform.y).toBe(100);

            // If we add an off-center point at (150, 50):
            shapeComp.elements.push({ id: 'p3', type: 'point', x: 150, y: 50 });
            ShapeMath.recalculateEntityBounds(entity, shapeComp, false);

            // The bounding box expands to encompass the new point, and entity center shifts
            expect(entity.components.Transform.width).toBeGreaterThan(100);
            expect(entity.components.Transform.x).toBeGreaterThan(100);
        });
    });

    describe('TilemapMath - Tile Grid & Bounding Calculations', () => {
        it('calculates accurate bounds for sparse multi-tile configurations', () => {
            const tm = {
                width: 32,
                height: 32,
                data: {
                    '1,2': 5,
                    '4,6': 7
                }
            };

            const bounds = TilemapMath.getBounds(tm);
            expect(bounds.hasTiles).toBe(true);
            expect(bounds.minX).toBe(1);
            expect(bounds.maxX).toBe(4);
            expect(bounds.minY).toBe(2);
            expect(bounds.maxY).toBe(6);

            // Columns = 4 - 1 + 1 = 4 -> width = 4 * 32 = 128
            expect(bounds.width).toBe(128);
            // Rows = 6 - 2 + 1 = 5 -> height = 5 * 32 = 160
            expect(bounds.height).toBe(160);
            expect(bounds.offsetX).toBe(1 * 32);
            expect(bounds.offsetY).toBe(2 * 32);
        });

        it('handles negative grid tile coordinates in bounds calculation', () => {
            const tm = {
                width: 32,
                height: 32,
                data: {
                    '-3,-2': 1,
                    '2,1': 1
                }
            };

            const bounds = TilemapMath.getBounds(tm);
            expect(bounds.minX).toBe(-3);
            expect(bounds.maxX).toBe(2);
            expect(bounds.minY).toBe(-2);
            expect(bounds.maxY).toBe(1);
            // cols = 2 - (-3) + 1 = 6
            expect(bounds.width).toBe(6 * 32);
        });

        it('returns default 1-tile bounds when tilemap is empty or contains only zeros', () => {
            const emptyTm = { width: 32, height: 32, data: {} };
            const boundsEmpty = TilemapMath.getBounds(emptyTm);
            expect(boundsEmpty.hasTiles).toBe(false);
            expect(boundsEmpty.width).toBe(32);
            expect(boundsEmpty.height).toBe(32);

            const zeroTm = { width: 32, height: 32, data: { '1,1': 0 } };
            const boundsZero = TilemapMath.getBounds(zeroTm);
            expect(boundsZero.hasTiles).toBe(false);
        });

        it('caches bounds and reuses cache until invalidated or data changes', () => {
            const tm = {
                width: 32,
                height: 32,
                data: { '0,0': 1, '5,5': 2 }
            };

            const bounds1 = TilemapMath.getBounds(tm);
            expect(bounds1.hasTiles).toBe(true);
            expect(bounds1.maxX).toBe(5);

            // Second call returns identical cached reference
            const bounds2 = TilemapMath.getBounds(tm);
            expect(bounds2).toBe(bounds1);
            expect(tm._placedTiles.length).toBe(2);

            // Invalidate bounds
            TilemapMath.invalidateBounds(tm);
            tm.data['10,10'] = 3;
            const bounds3 = TilemapMath.getBounds(tm);
            expect(bounds3).not.toBe(bounds1);
            expect(bounds3.maxX).toBe(10);
            expect(tm._placedTiles.length).toBe(3);
        });

        it('getMouseGridPosition calculates integer grid cell from canvas mouse input', () => {
            const entity = {
                components: {
                    Transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }
                }
            };
            const tm = { width: 32, height: 32 };
            // Canvas center (960, 540), mouse at (960 + 64, 540 + 96) -> world (64, 96)
            const game = {
                world: {},
                camera: { x: 0, y: 0, scale: 1 },
                input: { mouse: { x: 1024, y: 636 } },
                renderer: { canvas: { width: 1920, height: 1080 } }
            };

            const gridPos = TilemapMath.getMouseGridPosition(game, entity, tm);
            expect(gridPos).toEqual({ x: 2, y: 3 }); // 64 / 32 = 2, 96 / 32 = 3
        });

        it('generates 4 quad world vertices for tilemap bounds', () => {
            const tm = {
                width: 32,
                height: 32,
                data: { '0,0': 1, '1,1': 1 } // 2x2 tiles = 64x64
            };
            const absPos = { x: 100, y: 100 };
            const quad = TilemapMath.getTilemapQuadVertices(absPos, tm, 0, 1, 1);

            expect(quad.tl.x).toBeCloseTo(100);
            expect(quad.tl.y).toBeCloseTo(100);
            expect(quad.tr.x).toBeCloseTo(164);
            expect(quad.tr.y).toBeCloseTo(100);
            expect(quad.br.x).toBeCloseTo(164);
            expect(quad.br.y).toBeCloseTo(164);
            expect(quad.bl.x).toBeCloseTo(100);
            expect(quad.bl.y).toBeCloseTo(164);
        });

        it('finds entity deeply nested inside hierarchy', () => {
            const deepChild = { id: 'deep-1', children: [] };
            const parent = { id: 'parent-1', children: [deepChild] };
            const rootEntity = { id: 'root-1', children: [parent] };
            const world = { layersWorld: [{ entities: [rootEntity] }] };

            const found = TilemapMath.findEntity(world, 'deep-1');
            expect(found).toBe(deepChild);

            const notFound = TilemapMath.findEntity(world, 'non-existent');
            expect(notFound).toBeNull();
        });
    });

    describe('TilemapSelection - Selection & Drag Calculations', () => {
        it('commitMove deletes source tiles and writes tiles at target offset', () => {
            const applyDataChange = vi.fn();
            const operations = { applyDataChange };
            const selection = new TilemapSelection(operations);

            const entity = { id: 'tm-ent' };
            const tm = {
                data: {
                    '10,10': 1,
                    '11,10': 2
                }
            };
            const dragState = {
                data: [1, 2],
                w: 2,
                h: 1,
                sourceX: 10,
                sourceY: 10,
                offX: 0,
                offY: 0
            };

            // Move by (5, 5) -> target is (15, 15)
            selection.commitMove(entity, tm, dragState, 15, 15);

            expect(applyDataChange).toHaveBeenCalledTimes(1);
            const resultingData = applyDataChange.mock.calls[0][2];
            const oldData = applyDataChange.mock.calls[0][3];
            const desc = applyDataChange.mock.calls[0][4];

            // Old keys should be deleted
            expect(resultingData['10,10']).toBeUndefined();
            expect(resultingData['11,10']).toBeUndefined();
            // New keys should be populated
            expect(resultingData['15,15']).toBe(1);
            expect(resultingData['16,15']).toBe(2);
            expect(oldData).toEqual({ '10,10': 1, '11,10': 2 });
            expect(desc).toBe('Move Marquee Tiles');
        });

        it('handleEraser computes marquee selection area while mouse is dragged', () => {
            const operations = { paint: vi.fn(), deleteArea: vi.fn() };
            const selection = new TilemapSelection(operations);

            const input = {
                mouse: { isDown: (b) => b === 0 },
                keyboard: { isDown: (k) => k === 'Control' }
            };
            const editors = {};

            // Start drag at grid (2, 3)
            selection.handleEraser(input, {}, {}, { x: 2, y: 3 }, editors);
            expect(selection.mouseDownPos).toEqual({ x: 2, y: 3 });

            // Move drag to grid (5, 6)
            selection.handleEraser(input, {}, {}, { x: 5, y: 6 }, editors);
            // Marquee from (2, 3) to (5, 6): w = |5 - 2| + 1 = 4, h = |6 - 3| + 1 = 4
            expect(editors.marqueeSelection).toEqual({ x: 2, y: 3, w: 4, h: 4 });

            // Release mouse -> commits deleteArea
            const inputRelease = { mouse: { isDown: () => false }, keyboard: { isDown: () => false } };
            selection.handleEraser(inputRelease, {}, {}, null, editors);

            expect(operations.deleteArea).toHaveBeenCalledWith(expect.anything(), expect.anything(), 2, 3, 4, 4);
            expect(editors.marqueeSelection).toBeNull();
        });

        it('handleSelectionAndMove supports directly dragging and moving a single tile in one motion', () => {
            const applyDataChange = vi.fn();
            const operations = { applyDataChange };
            const selection = new TilemapSelection(operations);
            const tm = { data: { '5,5': 42 } };
            const entity = { id: 'single-tile-entity' };
            const editors = {};

            const mouseDown = { mouse: { isDown: (b) => b === 0 } };
            const mouseUp = { mouse: { isDown: () => false } };

            // 1. Mouse down directly on tile (5, 5)
            selection.handleSelectionAndMove(mouseDown, entity, tm, { x: 5, y: 5 }, editors);
            expect(editors.dragState).toEqual({
                data: [42],
                w: 1,
                h: 1,
                sourceX: 5,
                sourceY: 5,
                offX: 0,
                offY: 0
            });
            expect(selection.isDragging).toBe(true);

            // 2. Drag to (8, 9)
            selection.handleSelectionAndMove(mouseDown, entity, tm, { x: 8, y: 9 }, editors);
            expect(selection.dragHasMoved).toBe(true);

            // 3. Mouse up at (8, 9) -> commits move
            selection.handleSelectionAndMove(mouseUp, entity, tm, { x: 8, y: 9 }, editors);
            expect(applyDataChange).toHaveBeenCalledTimes(1);
            const resultData = applyDataChange.mock.calls[0][2];
            expect(resultData['5,5']).toBeUndefined();
            expect(resultData['8,9']).toBe(42);
            expect(editors.marqueeSelection).toEqual({ x: 8, y: 9, w: 1, h: 1 });
            expect(editors.dragState).toBeNull();
        });

        it('handleSelectionAndMove selects single tile if clicked without dragging', () => {
            const applyDataChange = vi.fn();
            const operations = { applyDataChange };
            const selection = new TilemapSelection(operations);
            const tm = { data: { '5,5': 42 } };
            const entity = { id: 'single-tile-entity' };
            const editors = {};

            const mouseDown = { mouse: { isDown: (b) => b === 0 } };
            const mouseUp = { mouse: { isDown: () => false } };

            // Mouse down and mouse up at identical position (5, 5) without movement
            selection.handleSelectionAndMove(mouseDown, entity, tm, { x: 5, y: 5 }, editors);
            selection.handleSelectionAndMove(mouseUp, entity, tm, { x: 5, y: 5 }, editors);

            // Did not move, so applyDataChange not called; tile is now selected as 1x1 marquee
            expect(applyDataChange).not.toHaveBeenCalled();
            expect(editors.marqueeSelection).toEqual({ x: 5, y: 5, w: 1, h: 1 });
            expect(editors.dragState).toBeNull();
        });

        it('handleSelectionAndMove creates and keeps marquee selection around non-empty tiles on mouse up when holding Ctrl', () => {
            const operations = { applyDataChange: vi.fn() };
            const selection = new TilemapSelection(operations);
            const tm = { data: { '2,2': 1, '3,2': 2 } };
            const editors = {};

            const mouseDownCtrl = { mouse: { isDown: (b) => b === 0 }, keyboard: { isDown: (k) => k === 'Control' } };
            const mouseUpCtrl = { mouse: { isDown: () => false }, keyboard: { isDown: (k) => k === 'Control' } };

            // 1. Mouse down with Ctrl to draw marquee starting even on filled tile (2, 2)
            selection.handleSelectionAndMove(mouseDownCtrl, {}, tm, { x: 2, y: 2 }, editors, true);
            expect(selection.isSelecting).toBe(true);

            // 2. Drag to (3, 3)
            selection.handleSelectionAndMove(mouseDownCtrl, {}, tm, { x: 3, y: 3 }, editors, true);
            expect(editors.marqueeSelection).toEqual({ x: 2, y: 2, w: 2, h: 2 });

            // 3. Mouse up at (3, 3)
            selection.handleSelectionAndMove(mouseUpCtrl, {}, tm, { x: 3, y: 3 }, editors, true);
            expect(selection.isSelecting).toBe(false);
            // Marquee selection should remain active
            expect(editors.marqueeSelection).toEqual({ x: 2, y: 2, w: 2, h: 2 });
            expect(editors.dragState).toBeFalsy();
            expect(operations.applyDataChange).not.toHaveBeenCalled();
        });

        it('handleSelectionAndMove clears marquee on mouse up if area contains only empty cells', () => {
            const operations = { applyDataChange: vi.fn() };
            const selection = new TilemapSelection(operations);
            const tm = { data: { '10,10': 1 } };
            const editors = {};

            const mouseDownCtrl = { mouse: { isDown: (b) => b === 0 }, keyboard: { isDown: (k) => k === 'Control' } };
            const mouseUpCtrl = { mouse: { isDown: () => false }, keyboard: { isDown: (k) => k === 'Control' } };

            // Select empty area (0, 0) to (1, 1) with Ctrl
            selection.handleSelectionAndMove(mouseDownCtrl, {}, tm, { x: 0, y: 0 }, editors, true);
            selection.handleSelectionAndMove(mouseDownCtrl, {}, tm, { x: 1, y: 1 }, editors, true);
            selection.handleSelectionAndMove(mouseUpCtrl, {}, tm, { x: 1, y: 1 }, editors, true);

            expect(editors.marqueeSelection).toBeNull();
            expect(editors.dragState).toBeFalsy();
        });

        it('handleSelectionAndMove allows moving multi-selected tiles after releasing Ctrl and dragging', () => {
            const applyDataChange = vi.fn();
            const operations = { applyDataChange };
            const selection = new TilemapSelection(operations);
            const tm = {
                data: {
                    '2,2': 1,
                    '3,2': 2
                }
            };
            const entity = { id: 'test-entity' };
            const editors = {};

            const mouseDownCtrl = { mouse: { isDown: (b) => b === 0 }, keyboard: { isDown: (k) => k === 'Control' } };
            const mouseUpCtrl = { mouse: { isDown: () => false }, keyboard: { isDown: (k) => k === 'Control' } };
            const mouseDownNoCtrl = { mouse: { isDown: (b) => b === 0 }, keyboard: { isDown: () => false } };
            const mouseUpNoCtrl = { mouse: { isDown: () => false }, keyboard: { isDown: () => false } };

            // Phase 1: Hold Ctrl and drag marquee from (2, 2) to (3, 2)
            selection.handleSelectionAndMove(mouseDownCtrl, entity, tm, { x: 2, y: 2 }, editors, true);
            selection.handleSelectionAndMove(mouseDownCtrl, entity, tm, { x: 3, y: 2 }, editors, true);
            selection.handleSelectionAndMove(mouseUpCtrl, entity, tm, { x: 3, y: 2 }, editors, true);

            expect(editors.marqueeSelection).toEqual({ x: 2, y: 2, w: 2, h: 1 });

            // Phase 2: Ctrl is released! User clicks inside marquee at (2, 2) and drags to (6, 5)
            selection.handleSelectionAndMove(mouseDownNoCtrl, entity, tm, { x: 2, y: 2 }, editors, false);
            expect(selection.isDragging).toBe(true);
            expect(editors.dragState).toEqual({
                data: [1, 2],
                w: 2,
                h: 1,
                sourceX: 2,
                sourceY: 2,
                offX: 0,
                offY: 0
            });

            // Dragging to (6, 5)
            selection.handleSelectionAndMove(mouseDownNoCtrl, entity, tm, { x: 6, y: 5 }, editors, false);
            expect(selection.dragHasMoved).toBe(true);

            // Phase 3: Mouse released at (6, 5) -> drops multi-selected tiles at target!
            selection.handleSelectionAndMove(mouseUpNoCtrl, entity, tm, { x: 6, y: 5 }, editors, false);

            expect(applyDataChange).toHaveBeenCalledTimes(1);
            const updatedData = applyDataChange.mock.calls[0][2];
            expect(updatedData['2,2']).toBeUndefined();
            expect(updatedData['3,2']).toBeUndefined();
            expect(updatedData['6,5']).toBe(1);
            expect(updatedData['7,5']).toBe(2);
            expect(editors.marqueeSelection).toEqual({ x: 6, y: 5, w: 2, h: 1 });
            expect(editors.dragState).toBeNull();
        });

        it('handleSelectionAndMove does not mutate data when dropped at identical coordinates', () => {
            const applyDataChange = vi.fn();
            const operations = { applyDataChange };
            const selection = new TilemapSelection(operations);
            const tm = { data: { '5,5': 3 } };
            const entity = { id: 'ent-1' };
            const editors = {
                marqueeSelection: { x: 5, y: 5, w: 1, h: 1 }
            };

            const mouseDown = { mouse: { isDown: (b) => b === 0 } };
            const mouseUp = { mouse: { isDown: () => false } };

            // Click on (5, 5) and release without moving
            selection.handleSelectionAndMove(mouseDown, entity, tm, { x: 5, y: 5 }, editors);
            expect(selection.isDragging).toBe(true);
            selection.handleSelectionAndMove(mouseUp, entity, tm, { x: 5, y: 5 }, editors);

            expect(applyDataChange).not.toHaveBeenCalled();
            expect(editors.marqueeSelection).toEqual({ x: 5, y: 5, w: 1, h: 1 });
            expect(editors.dragState).toBeNull();
        });

        it('handleSelectionAndMove clears active selection when user clicks outside', () => {
            const operations = { applyDataChange: vi.fn() };
            const selection = new TilemapSelection(operations);
            const tm = { data: { '2,2': 1 } };
            const editors = {
                marqueeSelection: { x: 2, y: 2, w: 1, h: 1 }
            };

            const mouseDown = { mouse: { isDown: (b) => b === 0 } };
            const mouseUp = { mouse: { isDown: () => false } };

            // Click at (10, 10) (empty tile outside selection)
            selection.handleSelectionAndMove(mouseDown, {}, tm, { x: 10, y: 10 }, editors);
            selection.handleSelectionAndMove(mouseUp, {}, tm, { x: 10, y: 10 }, editors);

            // Previous marquee should be gone, and since (10, 10) is empty, marquee remains null
            expect(editors.marqueeSelection).toBeNull();
            expect(editors.dragState).toBeFalsy();
        });
    });

    describe('TilemapOperations - History and Data Change Operations', () => {
        it('deleteArea deletes tiles and passes oldData and description to applyDataChange', () => {
            const ops = new TilemapOperations();
            const spyApply = vi.spyOn(ops, 'applyDataChange').mockImplementation(() => {});

            const entity = { id: 'ent-1' };
            const tm = { data: { '1,1': 5, '2,1': 6, '10,10': 9 } };

            // Delete 2x1 area from (1, 1)
            ops.deleteArea(entity, tm, 1, 1, 2, 1);

            expect(spyApply).toHaveBeenCalledTimes(1);
            const [passedEntity, passedTm, newData, oldData, desc] = spyApply.mock.calls[0];

            expect(newData['1,1']).toBeUndefined();
            expect(newData['2,1']).toBeUndefined();
            expect(newData['10,10']).toBe(9);
            expect(oldData).toEqual({ '1,1': 5, '2,1': 6, '10,10': 9 });
            expect(desc).toBe('Delete Marquee Tiles');
        });

        it('deleteArea handles 1x1 single tile delete with description Delete Tile', () => {
            const ops = new TilemapOperations();
            const spyApply = vi.spyOn(ops, 'applyDataChange').mockImplementation(() => {});

            const entity = { id: 'ent-1' };
            const tm = { data: { '1,1': 5 } };

            ops.deleteArea(entity, tm, 1, 1, 1, 1);

            expect(spyApply).toHaveBeenCalledTimes(1);
            expect(spyApply.mock.calls[0][4]).toBe('Delete Tile');
        });

        it('handleBucket fills contiguous tiles and passes oldData and description Bucket Fill', () => {
            const ops = new TilemapOperations();
            const spyApply = vi.spyOn(ops, 'applyDataChange').mockImplementation(() => {});

            const entity = { id: 'ent-1' };
            const tm = {
                assetId: 'asset_1',
                width: 16,
                data: { '0,0': 1, '1,0': 1, '0,1': 1 }
            };
            const world = {
                assets: {
                    textures: {
                        asset_1: { width: 64 }
                    }
                }
            };

            ops.handleBucket(world, entity, tm, 0, 0, { x: 2, y: 0 });

            expect(spyApply).toHaveBeenCalledTimes(1);
            const [passedEntity, passedTm, newData, oldData, desc] = spyApply.mock.calls[0];

            expect(desc).toBe('Bucket Fill');
            expect(oldData).toEqual({ '0,0': 1, '1,0': 1, '0,1': 1 });
            expect(newData['0,0']).toBe(3); // (0 * 4) + 2 + 1 = 3
        });

        it('startStroke and endStroke emit stroke transaction with initial data once completed', () => {
            const ops = new TilemapOperations();
            const spyApply = vi.spyOn(ops, 'applyDataChange');

            const entity = { id: 'ent-1' };
            const tm = { data: { '0,0': 1 } };

            ops.startStroke(entity, tm, 'Paint');
            expect(ops.activeStroke).toEqual({
                entityId: 'ent-1',
                initialData: { '0,0': 1 },
                toolName: 'Paint'
            });

            // Simulate paint modifying tm.data
            tm.data = { '0,0': 1, '1,0': 2 };

            ops.endStroke(entity, tm);

            expect(ops.activeStroke).toBeNull();
            expect(spyApply).toHaveBeenCalledWith(
                entity,
                tm,
                { '0,0': 1, '1,0': 2 },
                { '0,0': 1 },
                'Paint Tiles'
            );
        });
    });
});

