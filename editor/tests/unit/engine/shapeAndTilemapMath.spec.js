import { describe, it, expect, vi } from 'vitest';
import { ShapeMath } from '@core/Editor/Shape/ShapeMath.js';
import { TilemapMath } from '@core/Editor/Tilemap/TilemapMath.js';
import { TilemapSelection } from '@core/Editor/Tilemap/TilemapSelection.js';

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

            // Old keys should be deleted
            expect(resultingData['10,10']).toBeUndefined();
            expect(resultingData['11,10']).toBeUndefined();
            // New keys should be populated
            expect(resultingData['15,15']).toBe(1);
            expect(resultingData['16,15']).toBe(2);
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
    });
});
