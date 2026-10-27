import { describe, it, expect, vi } from 'vitest';
import { TransformEngine } from '@core/Editor/Transform/TransformEngine.js';
import { TransformGeometry } from '@core/Editor/Transform/TransformGeometry.js';
import { TransformMediator } from '@core/Editor/Transform/TransformMediator.js';
import { ApplyResizeToEntity } from '@core/Util/ApplyResizeToEntity.js';
import { computeGlobalTransform, worldToLocalTransform } from '@/utils/transformMath.js';

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

        it('calculates child UI absolute position relative to parent size (e.g. 900x900 parent)', () => {
            // Parent: centered on screen (1920x1080) at (960, 540), size 900x900, pivot (0.5, 0.5)
            const parentUI = {
                id: 'parent-panel',
                parentId: null,
                components: {
                    UITransform: {
                        x: 0,
                        y: 0,
                        anchorX: 0.5,
                        anchorY: 0.5,
                        pivotX: 0.5,
                        pivotY: 0.5,
                        width: 900,
                        height: 900
                    }
                }
            };

            // Child 1: centered within parent (anchor 0.5, 0.5)
            const childCenter = {
                id: 'child-center',
                parentId: 'parent-panel',
                components: {
                    UITransform: {
                        x: 0,
                        y: 0,
                        anchorX: 0.5,
                        anchorY: 0.5,
                        pivotX: 0.5,
                        pivotY: 0.5,
                        width: 100,
                        height: 100
                    }
                }
            };

            // Child 2: top-left corner of parent (anchor 0, 0, local offset 0, 0)
            const childTopLeft = {
                id: 'child-tl',
                parentId: 'parent-panel',
                components: {
                    UITransform: {
                        x: 0,
                        y: 0,
                        anchorX: 0,
                        anchorY: 0,
                        pivotX: 0.5,
                        pivotY: 0.5,
                        width: 100,
                        height: 100
                    }
                }
            };

            // Child 3: bottom-right corner of parent (anchor 1, 1, local offset 0, 0)
            const childBottomRight = {
                id: 'child-br',
                parentId: 'parent-panel',
                components: {
                    UITransform: {
                        x: 0,
                        y: 0,
                        anchorX: 1,
                        anchorY: 1,
                        pivotX: 0.5,
                        pivotY: 0.5,
                        width: 100,
                        height: 100
                    }
                }
            };

            const world = createMockWorld([parentUI, childCenter, childTopLeft, childBottomRight], { width: 1920, height: 1080 });
            const game = createMockGame(world);
            const geometry = new TransformGeometry(game, world);

            // Parent position: screen center (960, 540)
            const parentPos = geometry.calculateAbsolutePosition(parentUI);
            expect(parentPos.x).toBe(960);
            expect(parentPos.y).toBe(540);

            // Child 1 (centered): center is at (960, 540)
            const centerPos = geometry.calculateAbsolutePosition(childCenter);
            expect(centerPos.x).toBe(960);
            expect(centerPos.y).toBe(540);

            // Child 2 (top-left): left edge aligns with parent left edge (510).
            // With child width 100 and pivot 0.5, child center is at 510 + 50 = 560.
            // Top edge aligns with parent top edge (90).
            // With child height 100 and pivot 0.5, child center is at 90 + 50 = 140.
            // Entire child [510..610]x[90..190] is completely inside parent [510..1410]x[90..990]!
            const tlPos = geometry.calculateAbsolutePosition(childTopLeft);
            expect(tlPos.x).toBe(560);
            expect(tlPos.y).toBe(140);

            // Child 3 (bottom-right): right edge aligns with parent right edge (1410).
            // With child width 100 and pivot 0.5, child center is at 1410 - 50 = 1360.
            // Bottom edge aligns with parent bottom edge (990).
            // With child height 100 and pivot 0.5, child center is at 990 - 50 = 940.
            // Entire child [1310..1410]x[890..990] is completely inside parent [510..1410]x[90..990]!
            const brPos = geometry.calculateAbsolutePosition(childBottomRight);
            expect(brPos.x).toBe(1360);
            expect(brPos.y).toBe(940);
        });

        it('fits 200x56 child flush inside 400x56 display with Center-Left anchor without half-size offset', () => {
            // Parent display: 400x56 centered on screen at (960, 540).
            // Parent X range: [760, 1160], Y range: [512, 568].
            const displayParent = {
                id: 'display-400x56',
                parentId: null,
                components: {
                    UITransform: {
                        x: 0,
                        y: 0,
                        anchorX: 0.5,
                        anchorY: 0.5,
                        pivotX: 0.5,
                        pivotY: 0.5,
                        width: 400,
                        height: 56
                    }
                }
            };

            // Child: 200x56 with Center-Left anchor (anchorX: 0, anchorY: 0.5) and x: 0, y: 0
            const childCenterLeft = {
                id: 'child-200x56',
                parentId: 'display-400x56',
                components: {
                    UITransform: {
                        x: 0,
                        y: 0,
                        anchorX: 0,
                        anchorY: 0.5,
                        pivotX: 0.5,
                        pivotY: 0.5,
                        width: 200,
                        height: 56
                    }
                }
            };

            const world = createMockWorld([displayParent, childCenterLeft], { width: 1920, height: 1080 });
            const game = createMockGame(world);
            const geometry = new TransformGeometry(game, world);

            const childPos = geometry.calculateAbsolutePosition(childCenterLeft);
            // Child center is at 860. With width 200 and pivot 0.5:
            // Left edge = 860 - 100 = 760 (exact parent left edge!)
            // Right edge = 860 + 100 = 960 (half of parent display!)
            // Fits PAS inside without user needing to add +100 offset!
            expect(childPos.x).toBe(860);
            expect(childPos.y).toBe(540);
        });

        it('correctly anchors child inside a button (200x60 button with child text)', () => {
            const button = {
                id: 'btn-main',
                parentId: null,
                components: {
                    UITransform: {
                        x: 100,
                        y: 50,
                        anchorX: 0.5,
                        anchorY: 0.5,
                        pivotX: 0.5,
                        pivotY: 0.5,
                        width: 200,
                        height: 60
                    }
                }
            };

            // Child text centered inside button
            const textCentered = {
                id: 'btn-text-center',
                parentId: 'btn-main',
                components: {
                    UITransform: {
                        x: 0,
                        y: 0,
                        anchorX: 0.5,
                        anchorY: 0.5,
                        pivotX: 0.5,
                        pivotY: 0.5,
                        width: 80,
                        height: 24
                    }
                }
            };

            // Child icon aligned to left edge of button with 10px margin
            const iconLeft = {
                id: 'btn-icon-left',
                parentId: 'btn-main',
                components: {
                    UITransform: {
                        x: 10,
                        y: 0,
                        anchorX: 0, // left edge of button
                        anchorY: 0.5,
                        pivotX: 0, // pivot at icon left
                        pivotY: 0.5,
                        width: 24,
                        height: 24
                    }
                }
            };

            const world = createMockWorld([button, textCentered, iconLeft], { width: 1920, height: 1080 });
            const game = createMockGame(world);
            const geometry = new TransformGeometry(game, world);

            // Button is at screen center (960 + 100, 540 + 50) = (1060, 590)
            const btnPos = geometry.calculateAbsolutePosition(button);
            expect(btnPos.x).toBe(1060);
            expect(btnPos.y).toBe(590);

            // Text centered: exact same position as button center
            const textPos = geometry.calculateAbsolutePosition(textCentered);
            expect(textPos.x).toBe(1060);
            expect(textPos.y).toBe(590);

            // Icon left: left edge of button = 1060 - 200 * 0.5 = 960. With x = 10 -> 970
            const iconPos = geometry.calculateAbsolutePosition(iconLeft);
            expect(iconPos.x).toBe(970);
            expect(iconPos.y).toBe(590);
        });

        it('rotates child anchors when parent UI entity is rotated', () => {
            const parent = {
                id: 'parent-rot',
                parentId: null,
                components: {
                    UITransform: {
                        x: 0,
                        y: 0,
                        rotation: 90,
                        anchorX: 0.5,
                        anchorY: 0.5,
                        pivotX: 0.5,
                        pivotY: 0.5,
                        width: 900,
                        height: 900
                    }
                }
            };

            // Child anchored at right edge of parent: (anchorX: 1, anchorY: 0.5)
            // With child width 50 and pivot 0.5, child's right edge is at parent's right edge (+450),
            // so child center is at local offset (+425, 0).
            // When parent is rotated 90 deg clockwise: (+425, 0) rotates to (0, +425)
            const childRight = {
                id: 'child-right',
                parentId: 'parent-rot',
                components: {
                    UITransform: {
                        x: 0,
                        y: 0,
                        anchorX: 1,
                        anchorY: 0.5,
                        pivotX: 0.5,
                        pivotY: 0.5,
                        width: 50,
                        height: 50
                    }
                }
            };

            const world = createMockWorld([parent, childRight], { width: 1920, height: 1080 });
            const game = createMockGame(world);
            const geometry = new TransformGeometry(game, world);

            const childPos = geometry.calculateAbsolutePosition(childRight);
            expect(childPos.x).toBeCloseTo(960);
            expect(childPos.y).toBeCloseTo(540 + 425); // 965
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

    describe('worldToLocalTransform and computeGlobalTransform Utility', () => {
        it('calculates local coordinates from world when parent has translation', () => {
            const worldTransform = { x: 250, y: 350, rotation: 0, scaleX: 1, scaleY: 1 };
            const parentGlobal = { x: 100, y: 150, rotation: 0, scaleX: 1, scaleY: 1 };

            const local = worldToLocalTransform(worldTransform, parentGlobal);
            expect(local.x).toBe(150);
            expect(local.y).toBe(200);
            expect(local.rotation).toBe(0);
        });

        it('calculates local coordinates when parent has rotation and scale', () => {
            const worldTransform = { x: 60, y: 70, rotation: 90, scaleX: 2, scaleY: 2 };
            const parentGlobal = { x: 100, y: 50, rotation: 90, scaleX: 2, scaleY: 2 };

            const local = worldToLocalTransform(worldTransform, parentGlobal);
            expect(local.x).toBeCloseTo(10);
            expect(local.y).toBeCloseTo(20);
            expect(local.rotation).toBe(0);
            expect(local.scaleX).toBeCloseTo(1);
            expect(local.scaleY).toBeCloseTo(1);
        });

        it('returns world transform directly when parent is null (root level)', () => {
            const worldTransform = { x: 123, y: 456, rotation: 45, scaleX: 1.5, scaleY: 1.5 };
            const local = worldToLocalTransform(worldTransform, null);
            expect(local.x).toBe(123);
            expect(local.y).toBe(456);
            expect(local.rotation).toBe(45);
            expect(local.scaleX).toBe(1.5);
            expect(local.scaleY).toBe(1.5);
        });

        it('guarantees roundtrip invariance: computeGlobalTransform(child) matches original world pos', () => {
            const parent = {
                id: 'parent',
                parentId: null,
                components: { Transform: { x: 100, y: 200, rotation: 30, scaleX: 1.5, scaleY: 1.5 } }
            };
            const originalWorld = { x: 250, y: 300, rotation: 45, scaleX: 1.5, scaleY: 1.5 };

            const parentGlobal = computeGlobalTransform(parent, () => null);
            const local = worldToLocalTransform(originalWorld, parentGlobal);

            const child = {
                id: 'child',
                parentId: 'parent',
                components: { Transform: { ...local } }
            };

            const computedChildGlobal = computeGlobalTransform(child, id => (id === 'parent' ? parent : null));
            expect(computedChildGlobal.x).toBeCloseTo(originalWorld.x, 3);
            expect(computedChildGlobal.y).toBeCloseTo(originalWorld.y, 3);
            expect(computedChildGlobal.rotation).toBeCloseTo(originalWorld.rotation, 3);
        });

        it('guarantees roundtrip invariance for UI entity reparented into 900x900 parent with anchors', () => {
            const uiSettings = { width: 1920, height: 1080 };
            const parent = {
                id: 'parent-ui',
                parentId: null,
                components: {
                    UITransform: {
                        x: 0,
                        y: 0,
                        anchorX: 0.5,
                        anchorY: 0.5,
                        pivotX: 0.5,
                        pivotY: 0.5,
                        width: 900,
                        height: 900,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1
                    }
                }
            };
            const parentGlobal = computeGlobalTransform(parent, () => null, uiSettings);
            expect(parentGlobal.x).toBe(960);
            expect(parentGlobal.y).toBe(540);

            // Child UI entity anchored at bottom-right (anchorX: 1, anchorY: 1)
            // It should stay at world position (1360, 940) whose right and bottom edges align with parent
            const targetScreenPos = { x: 1360, y: 940, rotation: 0, scaleX: 1, scaleY: 1 };
            const childEntity = {
                id: 'child-ui',
                components: {
                    UITransform: {
                        anchorX: 1,
                        anchorY: 1,
                        pivotX: 0.5,
                        pivotY: 0.5,
                        width: 100,
                        height: 100
                    }
                }
            };

            const local = worldToLocalTransform(targetScreenPos, parentGlobal, childEntity, uiSettings);
            // In 900x900 parent with 100x100 child, bottom-right edge alignment puts child center at (1360, 940)
            // Therefore, local x and y should be 0!
            expect(local.x).toBeCloseTo(0, 3);
            expect(local.y).toBeCloseTo(0, 3);

            // Now computeGlobalTransform on this child
            const childWithLocal = {
                id: 'child-ui',
                parentId: 'parent-ui',
                components: {
                    UITransform: {
                        ...childEntity.components.UITransform,
                        ...local
                    }
                }
            };
            const computedGlobal = computeGlobalTransform(childWithLocal, id => (id === 'parent-ui' ? parent : null), uiSettings);
            expect(computedGlobal.x).toBeCloseTo(1360, 3);
            expect(computedGlobal.y).toBeCloseTo(940, 3);

            // Now test unparenting back to root
            const unparentedLocal = worldToLocalTransform(computedGlobal, null, childEntity, uiSettings);
            // Root anchorX = 1 -> 1920, so localX = 1360 - 1920 = -560
            // Root anchorY = 1 -> 1080, so localY = 940 - 1080 = -140
            expect(unparentedLocal.x).toBeCloseTo(1360 - 1920, 3);
            expect(unparentedLocal.y).toBeCloseTo(940 - 1080, 3);

            const rootChild = {
                id: 'child-ui',
                parentId: null,
                components: {
                    UITransform: {
                        ...childEntity.components.UITransform,
                        ...unparentedLocal
                    }
                }
            };
            const rootGlobal = computeGlobalTransform(rootChild, () => null, uiSettings);
            expect(rootGlobal.x).toBeCloseTo(1360, 3);
            expect(rootGlobal.y).toBeCloseTo(940, 3);
        });
    });
});
