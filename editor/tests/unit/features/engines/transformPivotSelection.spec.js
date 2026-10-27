import { describe, it, expect, vi } from 'vitest';
import { TransformEngine } from '@core/Editor/Transform/TransformEngine.js';
import { TransformGeometry } from '@core/Editor/Transform/TransformGeometry.js';
import { SelectionRenderer } from '@core/Editor/Selection/SelectionRenderer.js';
import { SelectionHit } from '@core/Editor/Selection/SelectionHit.js';

describe('Pivot and Transform/Selection Consistency', () => {
    const createMockWorld = (entities = []) => ({
        layersWorld: [{ entities }],
        layersUI: [],
        settings: { ui: { width: 1920, height: 1080 } }
    });

    const createMockGame = (world) => ({
        world,
        camera: { scale: 1 }
    });

    it('TransformEngine.getGlobalTransform includes pivotX, pivotY, width, height', () => {
        const entity = {
            id: 'e1',
            components: {
                Transform: {
                    x: 100,
                    y: 200,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                    pivotX: 0.25,
                    pivotY: 0.75,
                    width: 80,
                    height: 120
                }
            }
        };

        const world = createMockWorld([entity]);
        const engine = new TransformEngine(world);
        const globalT = engine.getGlobalTransform(entity);

        expect(globalT.x).toBe(100);
        expect(globalT.y).toBe(200);
        expect(globalT.pivotX).toBe(0.25);
        expect(globalT.pivotY).toBe(0.75);
        expect(globalT.width).toBe(80);
        expect(globalT.height).toBe(120);
    });

    it('TransformEngine.getGlobalTransform uses default pivot 0 for tilemaps, 0.5 for others', () => {
        const normalEntity = {
            id: 'norm',
            components: {
                Transform: { x: 0, y: 0 }
            }
        };
        const tilemapEntity = {
            id: 'tm',
            components: {
                Transform: { x: 0, y: 0 },
                Tilemap: { width: 32, height: 32, layers: [] }
            }
        };

        const world = createMockWorld([normalEntity, tilemapEntity]);
        const engine = new TransformEngine(world);

        const normGlobal = engine.getGlobalTransform(normalEntity);
        expect(normGlobal.pivotX).toBe(0.5);
        expect(normGlobal.pivotY).toBe(0.5);

        const tmGlobal = engine.getGlobalTransform(tilemapEntity);
        expect(tmGlobal.pivotX).toBe(0);
        expect(tmGlobal.pivotY).toBe(0);
    });

    it('TransformGeometry computes handles matching custom pivot and flipX', () => {
        const entity = {
            id: 'e1',
            components: {
                Transform: {
                    x: 100,
                    y: 100,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                    pivotX: 0,
                    pivotY: 0,
                    width: 50,
                    height: 50,
                    flipX: false,
                    flipY: false
                }
            }
        };

        const world = createMockWorld([entity]);
        const game = createMockGame(world);
        const geometry = new TransformGeometry(game, world);

        geometry.computeHandles([entity]);

        expect(geometry.groupBounds).toBeTruthy();
        expect(geometry.groupBounds.type).toBe('obb');
        const v = geometry.groupBounds.v;

        // With pivot (0, 0), top-left is at (100, 100)
        expect(v.tl.x).toBeCloseTo(100);
        expect(v.tl.y).toBeCloseTo(100);
        // top-right is at (150, 100)
        expect(v.tr.x).toBeCloseTo(150);
        expect(v.tr.y).toBeCloseTo(100);
        // bottom-left is at (100, 150)
        expect(v.bl.x).toBeCloseTo(100);
        expect(v.bl.y).toBeCloseTo(150);
        // bottom-right is at (150, 150)
        expect(v.br.x).toBeCloseTo(150);
        expect(v.br.y).toBeCloseTo(150);

        // Now test flipX: true
        entity.components.Transform.flipX = true;
        geometry.computeHandles([entity]);
        const vFlipped = geometry.groupBounds.v;

        // With flipX, width extends to the left from pivot (100 -> 50)
        expect(vFlipped.tl.x).toBeCloseTo(100);
        expect(vFlipped.tr.x).toBeCloseTo(50);
        expect(vFlipped.bl.x).toBeCloseTo(100);
        expect(vFlipped.br.x).toBeCloseTo(50);
    });

    it('SelectionRenderer.drawObb draws blue box matching pivot and flipX', () => {
        const entity = {
            id: 'e1',
            visible: true,
            components: {
                Transform: {
                    x: 200,
                    y: 300,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                    pivotX: 1,
                    pivotY: 1,
                    width: 100,
                    height: 80,
                    flipX: false,
                    flipY: false
                }
            }
        };

        const world = createMockWorld([entity]);
        const game = createMockGame(world);
        const engine = new TransformEngine(world);
        const renderer = new SelectionRenderer(game, engine);

        const drawnLines = [];
        const mockShape = {
            drawLine: vi.fn((x1, y1, x2, y2) => {
                drawnLines.push({ x1, y1, x2, y2 });
            })
        };

        renderer.drawObb(mockShape, entity, [0, 0.6, 1, 1], null, 2);

        expect(drawnLines.length).toBe(4);
        // With pivot (1, 1), bottom-right is at (200, 300)
        // Quad extends from (100, 220) to (200, 300)
        const allX = drawnLines.flatMap(l => [l.x1, l.x2]);
        const allY = drawnLines.flatMap(l => [l.y1, l.y2]);

        expect(Math.min(...allX)).toBeCloseTo(100);
        expect(Math.max(...allX)).toBeCloseTo(200);
        expect(Math.min(...allY)).toBeCloseTo(220);
        expect(Math.max(...allY)).toBeCloseTo(300);
    });

    it('SelectionHit._isPointInEntity respects custom pivot and flipX', () => {
        const entity = {
            id: 'e1',
            visible: true,
            components: {
                Transform: {
                    x: 100,
                    y: 100,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                    pivotX: 0,
                    pivotY: 0,
                    width: 50,
                    height: 50,
                    flipX: false,
                    flipY: false
                }
            }
        };

        const world = createMockWorld([entity]);
        const game = createMockGame(world);
        const engine = new TransformEngine(world);
        const hit = new SelectionHit(game, engine);

        // Point inside (120, 120) should hit
        expect(hit._isPointInEntity(120, 120, entity, null)).toBe(true);
        // Point on negative side (80, 80) should NOT hit
        expect(hit._isPointInEntity(80, 80, entity, null)).toBe(false);

        // When flipX is true, entity is on [50, 100] instead of [100, 150]
        entity.components.Transform.flipX = true;
        expect(hit._isPointInEntity(75, 120, entity, null)).toBe(true);
        expect(hit._isPointInEntity(120, 120, entity, null)).toBe(false);
    });
});
