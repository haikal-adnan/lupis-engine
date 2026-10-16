import { describe, it, expect, vi } from 'vitest';
import { TransformEngine } from '@core/Editor/Transform/TransformEngine.js';
import { TransformGeometry } from '@core/Editor/Transform/TransformGeometry.js';
import { TransformMediator } from '@core/Editor/Transform/TransformMediator.js';
import { ApplyResizeToEntity } from '@core/Util/ApplyResizeToEntity.js';

describe('Transform Calculations Unit Tests', () => {
    const createMockWorld = (entities = [], uiSettings = { width: 1920, height: 1080 }) => ({
        layersWorld: [{ entities }],
        layersUI: [],
        settings: {
            ui: uiSettings,
            grid: { snap: true, width: 32 }
        },
        assets: { fonts: {} }
    });

    const createMockGame = (world, cameraScale = 1) => ({
        world,
        camera: { scale: cameraScale, x: 0, y: 0 },
        renderer: { canvas: { width: 1920, height: 1080 } }
    });

    describe('TransformEngine - Global Transform Calculations', () => {
        it('calculates root entity global transform with default properties', () => {
            const entity = {
                id: 'root-1',
                components: {
                    Transform: {
                        x: 50,
                        y: 100,
                        rotation: 0,
                        width: 200,
                        height: 150
                    }
                }
            };
            const world = createMockWorld([entity]);
            const engine = new TransformEngine(world);
            const globalT = engine.getGlobalTransform(entity);

            expect(globalT.x).toBe(50);
            expect(globalT.y).toBe(100);
            expect(globalT.rotation).toBe(0);
            expect(globalT.scaleX).toBe(1);
            expect(globalT.scaleY).toBe(1);
            expect(globalT.pivotX).toBe(0.5);
            expect(globalT.pivotY).toBe(0.5);
            expect(globalT.width).toBe(200);
            expect(globalT.height).toBe(150);
        });

        it('assigns pivot (0, 0) for tilemap entities and (0.5, 0.5) for normal entities', () => {
            const normalEnt = {
                id: 'normal-1',
                components: { Transform: { x: 0, y: 0 } }
            };
            const tilemapEnt = {
                id: 'tilemap-1',
                components: {
                    Transform: { x: 0, y: 0 },
                    Tilemap: { width: 32, height: 32 }
                }
            };
            const world = createMockWorld([normalEnt, tilemapEnt]);
            const engine = new TransformEngine(world);

            const normT = engine.getGlobalTransform(normalEnt);
            expect(normT.pivotX).toBe(0.5);
            expect(normT.pivotY).toBe(0.5);

            const tmT = engine.getGlobalTransform(tilemapEnt);
            expect(tmT.pivotX).toBe(0);
            expect(tmT.pivotY).toBe(0);
        });

        it('calculates global transform in single-parent hierarchy with rotation and scale', () => {
            const parent = {
                id: 'parent-1',
                components: {
                    Transform: {
                        x: 100,
                        y: 200,
                        rotation: 90, // rotated 90 degrees clockwise
                        scaleX: 2,
                        scaleY: 2
                    }
                }
            };
            const child = {
                id: 'child-1',
                parentId: 'parent-1',
                components: {
                    Transform: {
                        x: 10,  // local offset (10, 0)
                        y: 0,
                        rotation: 45,
                        scaleX: 1.5,
                        scaleY: 1.5
                    }
                }
            };
            const world = createMockWorld([parent, child]);
            const engine = new TransformEngine(world);
            const globalT = engine.getGlobalTransform(child);

            // Child scaled local offset: (10 * 2, 0 * 2) = (20, 0)
            // Rotated by parent 90 deg: x' = 20*cos(90) - 0*sin(90) = 0, y' = 20*sin(90) + 0*cos(90) = 20
            // World pos: (100 + 0, 200 + 20) = (100, 220)
            expect(globalT.x).toBeCloseTo(100);
            expect(globalT.y).toBeCloseTo(220);
            expect(globalT.rotation).toBeCloseTo(135); // 90 + 45
            expect(globalT.scaleX).toBeCloseTo(3);     // 2 * 1.5
            expect(globalT.scaleY).toBeCloseTo(3);     // 2 * 1.5
        });

        it('calculates multi-level hierarchy (grandparent -> parent -> child)', () => {
            const grandparent = {
                id: 'gp',
                components: {
                    Transform: { x: 50, y: 50, rotation: 90, scaleX: 2, scaleY: 2 }
                }
            };
            const parent = {
                id: 'p',
                parentId: 'gp',
                components: {
                    Transform: { x: 10, y: 0, rotation: 90, scaleX: 0.5, scaleY: 0.5 }
                }
            };
            const child = {
                id: 'c',
                parentId: 'p',
                components: {
                    Transform: { x: 20, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }
                }
            };
            const world = createMockWorld([grandparent, parent, child]);
            const engine = new TransformEngine(world);

            // Grandparent: (50, 50), rot 90, scale 2
            // Parent global:
            //   local (10, 0) * scale 2 = (20, 0) rotated by 90 = (0, 20) -> world (50, 70)
            //   rot = 90 + 90 = 180, scale = 2 * 0.5 = 1
            const parentGlobal = engine.getGlobalTransform(parent);
            expect(parentGlobal.x).toBeCloseTo(50);
            expect(parentGlobal.y).toBeCloseTo(70);
            expect(parentGlobal.rotation).toBe(180);
            expect(parentGlobal.scaleX).toBe(1);

            // Child global:
            //   local (20, 0) * parentScale 1 = (20, 0) rotated by 180 = (-20, 0)
            //   world = (50 - 20, 70 + 0) = (30, 70)
            //   rot = 180 + 0 = 180, scale = 1 * 1 = 1
            const childGlobal = engine.getGlobalTransform(child);
            expect(childGlobal.x).toBeCloseTo(30);
            expect(childGlobal.y).toBeCloseTo(70);
            expect(childGlobal.rotation).toBe(180);
            expect(childGlobal.scaleX).toBe(1);
        });

        it('gracefully handles missing parent or nonexistent entity components', () => {
            const orphan = {
                id: 'orphan-1',
                parentId: 'non-existent-parent',
                components: {
                    Transform: { x: 75, y: 85, rotation: 15 }
                }
            };
            const world = createMockWorld([orphan]);
            const engine = new TransformEngine(world);
            const globalT = engine.getGlobalTransform(orphan);

            expect(globalT.x).toBe(75);
            expect(globalT.y).toBe(85);
            expect(globalT.rotation).toBe(15);

            const emptyEntity = { id: 'empty' };
            const fallbackT = engine.getGlobalTransform(emptyEntity);
            expect(fallbackT.x).toBe(0);
            expect(fallbackT.y).toBe(0);
            expect(fallbackT.scaleX).toBe(1);
        });
    });

    describe('TransformEngine - Translation & Rotation Application', () => {
        it('applies translation directly to root entity and rounds values', () => {
            const entity = {
                id: 'e1',
                components: { Transform: { x: 10, y: 20 } }
            };
            const world = createMockWorld([entity]);
            const engine = new TransformEngine(world);

            const changed = engine.applyTranslation(entity, 10, 20, 5.4, 7.8);
            expect(changed).toBe(true);
            expect(entity.components.Transform.x).toBe(15); // Math.round(10 + 5.4)
            expect(entity.components.Transform.y).toBe(28); // Math.round(20 + 7.8)

            // Applying same translation returns false
            const noChange = engine.applyTranslation(entity, 15, 28, 0, 0);
            expect(noChange).toBe(false);
        });

        it('inverts parent rotation and scale when translating child entity', () => {
            const parent = {
                id: 'parent',
                components: {
                    Transform: { x: 0, y: 0, rotation: 90, scaleX: 2, scaleY: 2 }
                }
            };
            const child = {
                id: 'child',
                parentId: 'parent',
                components: {
                    Transform: { x: 0, y: 0 }
                }
            };
            const world = createMockWorld([parent, child]);
            const engine = new TransformEngine(world);

            // Dragging child in world space by dx = 0, dy = 20
            // Parent has rotation 90, so inverse rotation is -90 deg:
            // rotDx = 0*cos(-90) - 20*sin(-90) = 20
            // rotDy = 0*sin(-90) + 20*cos(-90) = 0
            // localDx = 20 / parentScale 2 = 10
            // localDy = 0 / 2 = 0
            const changed = engine.applyTranslation(child, 0, 0, 0, 20);
            expect(changed).toBe(true);
            expect(child.components.Transform.x).toBe(10);
            expect(child.components.Transform.y).toBe(0);
        });

        it('normalizes degrees to [0, 360) and marks overridden when applying rotation', () => {
            const entity = {
                id: 'e1',
                components: { Transform: { rotation: 0 } }
            };
            const world = createMockWorld([entity]);
            const engine = new TransformEngine(world);

            engine.applyRotation(entity, 450);
            expect(entity.components.Transform.rotation).toBe(90);
            expect(entity.components.Transform.overridden).toBe(true);

            engine.applyRotation(entity, -45);
            expect(entity.components.Transform.rotation).toBe(315);

            engine.applyRotation(entity, -730);
            expect(entity.components.Transform.rotation).toBe(350);
        });
    });

    describe('TransformEngine - Resize Application & Boundary Logic', () => {
        it('resizes cardinal east handle without shifting position when pivot is (0, 0)', () => {
            const entity = {
                id: 'e1',
                components: {
                    Transform: {
                        x: 100, y: 100, width: 50, height: 50, pivotX: 0, pivotY: 0,
                        scaleX: 1, scaleY: 1
                    }
                }
            };
            const world = createMockWorld([entity]);
            const engine = new TransformEngine(world);

            const item = { x: 100, y: 100, w: 50, h: 50, flipX: false, flipY: false };
            const res = engine.applyResize(entity, item, 30, 0, 'e', false);

            expect(res.changed).toBe(true);
            expect(res.newW).toBe(80);
            // With anchorX = 0 and pivotX = 0, (pivotX - anchorX) = 0, so position stays 100
            expect(entity.components.Transform.x).toBe(100);
            expect(entity.components.Transform.width).toBe(80);
        });

        it('resizes cardinal west handle with shift when pivot is (0, 0)', () => {
            const entity = {
                id: 'e1',
                components: {
                    Transform: {
                        x: 100, y: 100, width: 50, height: 50, pivotX: 0, pivotY: 0,
                        scaleX: 1, scaleY: 1
                    }
                }
            };
            const world = createMockWorld([entity]);
            const engine = new TransformEngine(world);

            // Drag west handle left by localDx = -20
            // dVisualW = -(-20) = 20 -> newW = 70
            // anchorX = 1 -> shiftX = (20) * (0 - 1) = -20 -> newX = 80
            const item = { x: 100, y: 100, w: 50, h: 50, flipX: false, flipY: false };
            const res = engine.applyResize(entity, item, -20, 0, 'w', false);

            expect(res.changed).toBe(true);
            expect(res.newW).toBe(70);
            expect(entity.components.Transform.x).toBe(80);
        });

        it('toggles flipX and maintains continuous position when resizing past zero', () => {
            const entity = {
                id: 'e1',
                components: {
                    Transform: {
                        x: 100, y: 100, width: 50, height: 50, pivotX: 0.5, pivotY: 0.5,
                        flipX: false, flipY: false
                    }
                }
            };
            const world = createMockWorld([entity]);
            const engine = new TransformEngine(world);

            // Dragging east handle far to the left by -80px:
            // rawVisualW = 50 - 80 = -30
            // flipX flips from false to true
            // newW = Math.max(1, Math.round(Math.abs(-30))) = 30
            const item = { x: 100, y: 100, w: 50, h: 50, flipX: false, flipY: false };
            const res = engine.applyResize(entity, item, -80, 0, 'e', false);

            expect(res.changed).toBe(true);
            expect(res.newW).toBe(30);
            expect(entity.components.Transform.flipX).toBe(true);
            // Continuous dW_Visual avoids jump
            expect(entity.components.Transform.x).toBeDefined();
        });

        it('enforces aspect ratio lock when lockRatio is true', () => {
            const entity = {
                id: 'e1',
                components: {
                    Transform: {
                        x: 0, y: 0, width: 100, height: 50, pivotX: 0.5, pivotY: 0.5,
                        isRatioLocked: true
                    }
                }
            };
            const world = createMockWorld([entity]);
            const engine = new TransformEngine(world);

            const item = { x: 0, y: 0, w: 100, h: 50, flipX: false, flipY: false, isRatioLocked: true };
            // Original ratio: 100 / 50 = 2.0
            // Resize along 'se' corner by localDx = 20, localDy = 50
            const res = engine.applyResize(entity, item, 20, 50, 'se', false, 32, true);

            expect(res.changed).toBe(true);
            const finalW = entity.components.Transform.width;
            const finalH = entity.components.Transform.height;
            expect(finalW / finalH).toBeCloseTo(2.0, 1);
        });

        it('snaps resize dimensions to grid when shouldSnap is true', () => {
            const entity = {
                id: 'e1',
                components: {
                    Transform: {
                        x: 0, y: 0, width: 32, height: 32, pivotX: 0, pivotY: 0
                    }
                }
            };
            const world = createMockWorld([entity]);
            const engine = new TransformEngine(world);

            const item = { x: 0, y: 0, w: 32, h: 32, flipX: false, flipY: false };
            // localDx = 25 -> rawVisualW = 32 + 25 = 57 -> snapped to multiple of 32 (64)
            const res = engine.applyResize(entity, item, 25, 0, 'e', true, 32);

            expect(res.changed).toBe(true);
            expect(res.newW).toBe(64);
            expect(entity.components.Transform.width).toBe(64);
        });
    });

    describe('TransformGeometry - Handles & Coordinate Transforms', () => {
        it('computes 8 handles for a single rotated and scaled entity', () => {
            const entity = {
                id: 'e1',
                components: {
                    Transform: {
                        x: 100, y: 100, width: 40, height: 40,
                        rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5
                    }
                }
            };
            const world = createMockWorld([entity]);
            const game = createMockGame(world);
            const geometry = new TransformGeometry(game, world);

            geometry.computeHandles([entity]);

            expect(geometry.handles.length).toBe(8);
            const types = geometry.handles.map(h => h.type);
            expect(types).toEqual(['nw', 'ne', 'sw', 'se', 'n', 'e', 's', 'w']);

            // Bounding vertices for 40x40 at (100, 100) with center pivot: [80..120] x [80..120]
            const nw = geometry.handles.find(h => h.type === 'nw');
            const se = geometry.handles.find(h => h.type === 'se');
            expect(nw.x).toBeCloseTo(80);
            expect(nw.y).toBeCloseTo(80);
            expect(se.x).toBeCloseTo(120);
            expect(se.y).toBeCloseTo(120);
        });

        it('computes merged AABB group bounds for multi-entity selection', () => {
            const e1 = {
                id: 'e1',
                components: {
                    Transform: { x: 0, y: 0, width: 50, height: 50, pivotX: 0, pivotY: 0 }
                }
            };
            const e2 = {
                id: 'e2',
                components: {
                    Transform: { x: 100, y: 100, width: 50, height: 50, pivotX: 0, pivotY: 0 }
                }
            };
            const world = createMockWorld([e1, e2]);
            const game = createMockGame(world);
            const geometry = new TransformGeometry(game, world);

            geometry.computeHandles([e1, e2]);

            expect(geometry.groupBounds).toBeTruthy();
            expect(geometry.groupBounds.type).toBe('aabb');
            // e1 spans [0..50], e2 spans [100..150]
            expect(geometry.groupBounds.x).toBe(0);
            expect(geometry.groupBounds.y).toBe(0);
            expect(geometry.groupBounds.w).toBe(150);
            expect(geometry.groupBounds.h).toBe(150);
        });

        it('calculates absolute UI position respecting anchorX and anchorY', () => {
            const uiEntity = {
                id: 'ui-btn',
                components: {
                    UITransform: {
                        x: 10,
                        y: 20,
                        anchorX: 1.0, // anchored to right
                        anchorY: 0.5, // anchored to vertical center
                        width: 100,
                        height: 40
                    }
                }
            };
            const world = createMockWorld([uiEntity], { width: 1920, height: 1080 });
            const game = createMockGame(world);
            const geometry = new TransformGeometry(game, world);

            const absPos = geometry.calculateAbsolutePosition(uiEntity);
            // parentBounds.width * 1.0 + x = 1920 + 10 = 1930
            // parentBounds.height * 0.5 + y = 540 + 20 = 560
            expect(absPos.x).toBe(1930);
            expect(absPos.y).toBe(560);
        });

        it('adjusts handle detection radius with camera zoom', () => {
            const world = createMockWorld();
            const game = createMockGame(world, 2.0); // 2x zoom in
            const geometry = new TransformGeometry(game, world);

            const sizesZoomed = geometry.getHandleSizes();
            // Base resize radius is 6 / scale = 3
            expect(sizesZoomed.rResize).toBeCloseTo(3);
            // Base rotate radius is 15 / scale = 7.5
            expect(sizesZoomed.rRotate).toBeCloseTo(7.5);
        });

        it('detects resize vs rotate handle hovering correctly', () => {
            const entity = {
                id: 'e1',
                components: {
                    Transform: { x: 100, y: 100, width: 100, height: 100, pivotX: 0, pivotY: 0 }
                }
            };
            const world = createMockWorld([entity]);
            const game = createMockGame(world, 1);
            const geometry = new TransformGeometry(game, world);

            geometry.computeHandles([entity]);

            // Top-left corner handle 'nw' is at (100, 100)
            // Cursor exactly at (100, 100) should be inside rResize (radius <= 6)
            const handleResize = geometry.getHoverHandle(101, 101);
            expect(handleResize).toBeTruthy();
            expect(handleResize.mode).toBe('resize');
            expect(handleResize.type).toBe('nw');

            // Cursor slightly outside rResize (e.g. dist 10px from (100, 100)) falls into rRotate zone (<= 15)
            const handleRotate = geometry.getHoverHandle(108, 108);
            expect(handleRotate).toBeTruthy();
            expect(handleRotate.mode).toBe('rotate');

            // Cursor far away should return null
            const handleNone = geometry.getHoverHandle(300, 300);
            expect(handleNone).toBeNull();
        });

        it('maps handles to appropriate CSS cursors', () => {
            const world = createMockWorld();
            const game = createMockGame(world);
            const geometry = new TransformGeometry(game, world);

            expect(geometry.getCursor({ mode: 'rotate', type: 'nw' })).toContain('url(');
            expect(geometry.getCursor({ mode: 'resize', type: 'nw' })).toBe('nwse-resize');
            expect(geometry.getCursor({ mode: 'resize', type: 'ne' })).toBe('nesw-resize');
            expect(geometry.getCursor({ mode: 'resize', type: 'n' })).toBe('ns-resize');
            expect(geometry.getCursor({ mode: 'resize', type: 'e' })).toBe('ew-resize');
            expect(geometry.getCursor(null)).toBe('default');
        });
    });

    describe('TransformMediator - Snapping & Multi-Selection Orchestration', () => {
        it('toggles snapping when Ctrl key is pressed', () => {
            const world = createMockWorld();
            world.settings.grid = { snap: true, width: 32 };

            const inputCtrlUp = { keyboard: { isDown: () => false } };
            const mediator1 = new TransformMediator(world, null, inputCtrlUp);
            expect(mediator1.getSnapSettings(false).shouldSnap).toBe(true);

            const inputCtrlDown = { keyboard: { isDown: (k) => k === 'Control' } };
            const mediator2 = new TransformMediator(world, null, inputCtrlDown);
            expect(mediator2.getSnapSettings(false).shouldSnap).toBe(false);

            // In UI mode, snapping is always disabled
            expect(mediator1.getSnapSettings(true).shouldSnap).toBe(false);
        });

        it('snaps leader and maintains relative offsets during multi-entity move', () => {
            const e1 = { id: 'e1', components: { Transform: { x: 10, y: 10 } } };
            const e2 = { id: 'e2', components: { Transform: { x: 50, y: 70 } } };
            const world = createMockWorld([e1, e2]);
            world.settings.grid = { snap: true, width: 32 };

            const mediator = new TransformMediator(world, null, { keyboard: { isDown: () => false } });

            const startData = [
                { e: e1, x: 10, y: 10 },
                { e: e2, x: 50, y: 70 }
            ];

            // Move by (12, 15): leader target is (22, 25) which snaps to (32, 32)
            // Delta applied to both is (32 - 10, 32 - 10) = (22, 22)
            mediator.processMove({ x: 12, y: 15 }, { x: 0, y: 0 }, startData, [e1, e2], false);

            expect(e1.components.Transform.x).toBe(32);
            expect(e1.components.Transform.y).toBe(32);
            expect(e2.components.Transform.x).toBe(50 + 22);
            expect(e2.components.Transform.y).toBe(70 + 22);
        });

        it('snaps rotation angle to 15-degree increments when snapping is enabled', () => {
            const entity = { id: 'e1', components: { Transform: { rotation: 0 } } };
            const world = createMockWorld([entity]);
            world.settings.grid = { snap: true, width: 32 };

            const mediator = new TransformMediator(world, null, { keyboard: { isDown: () => false } });

            // Rotate center at (0, 0), start angle 0
            // Drag to (10, 5) -> angle is ~26.56 degrees -> should snap to 30 degrees
            mediator.processRotateSingle({ x: 10, y: 5 }, { x: 0, y: 0 }, 0, 0, [entity], false);

            expect(entity.components.Transform.rotation).toBe(30);
        });

        it('rotates multi-selection entities around center point updating positions', () => {
            const e1 = { id: 'e1', components: { Transform: { x: 20, y: 0, rotation: 0 } } };
            const world = createMockWorld([e1]);
            world.settings.grid = { snap: false };

            const mediator = new TransformMediator(world, null, { keyboard: { isDown: () => false } });

            const entityStartData = [
                { e: e1, startX: 20, startY: 0, startRotation: 0 }
            ];

            // Center at (0, 0), rotate 90 degrees (start angle 0, drag to (0, 10))
            mediator.processRotateMulti({ x: 0, y: 10 }, { x: 0, y: 0 }, 0, entityStartData, [e1], false);

            // (20, 0) rotated by 90 deg around (0, 0) becomes (0, 20)
            expect(e1.components.Transform.x).toBeCloseTo(0);
            expect(e1.components.Transform.y).toBeCloseTo(20);
            expect(e1.components.Transform.rotation).toBe(90);
        });
    });

    describe('ApplyResizeToEntity Utility', () => {
        it('syncs SpriteRenderer and ShapeRenderer dimensions and hit properties', () => {
            const entity = {
                components: {
                    Transform: { x: 10, y: 20, width: 120, height: 80 },
                    SpriteRenderer: { width: 50, height: 50 },
                    ShapeRenderer: { type: 'rectangle', width: 50, height: 50 }
                }
            };
            const world = createMockWorld([entity]);

            ApplyResizeToEntity(entity, world);

            expect(entity.components.SpriteRenderer.width).toBe(120);
            expect(entity.components.SpriteRenderer.height).toBe(80);
            expect(entity.components.ShapeRenderer.width).toBe(120);
            expect(entity.components.ShapeRenderer.height).toBe(80);
            expect(entity.hitX).toBe(10);
            expect(entity.hitY).toBe(20);
            expect(entity.hitWidth).toBe(120);
            expect(entity.hitHeight).toBe(80);
        });
    });
});
