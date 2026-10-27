import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    calculateEntityAABB,
    findSnapAdjustment,
    findResizeSnapAdjustment,
    UISmartGuides
} from '@core/Editor/Transform/UISmartGuides.js';
import { TransformMediator } from '@core/Editor/Transform/TransformMediator.js';

describe('UISmartGuides - Precision Math & Snapping Unit Tests', () => {

    describe('calculateEntityAABB', () => {
        it('calculates accurate AABB for a top-left anchored UI entity', () => {
            const entity = {
                id: 'btn-1',
                components: {
                    UITransform: {
                        anchorX: 0,
                        anchorY: 0,
                        x: 100,
                        y: 200,
                        width: 150,
                        height: 50,
                        pivotX: 0,
                        pivotY: 0,
                        rotation: 0
                    }
                }
            };

            const aabb = calculateEntityAABB(entity);
            expect(aabb).not.toBeNull();
            expect(aabb.left).toBeCloseTo(100);
            expect(aabb.right).toBeCloseTo(250);
            expect(aabb.top).toBeCloseTo(200);
            expect(aabb.bottom).toBeCloseTo(250);
            expect(aabb.centerX).toBeCloseTo(175);
            expect(aabb.centerY).toBeCloseTo(225);
            expect(aabb.width).toBeCloseTo(150);
            expect(aabb.height).toBeCloseTo(50);
        });

        it('calculates accurate AABB for a center-anchored UI entity on a 1920x1080 canvas', () => {
            const entity = {
                id: 'panel-center',
                components: {
                    UITransform: {
                        anchorX: 0.5,
                        anchorY: 0.5,
                        x: 0,
                        y: 0,
                        width: 400,
                        height: 200,
                        pivotX: 0.5,
                        pivotY: 0.5,
                        rotation: 0
                    }
                }
            };

            const world = { settings: { ui: { width: 1920, height: 1080 } } };
            const aabb = calculateEntityAABB(entity, world);

            // Anchor center = (960, 540). With pivot 0.5:
            // left = 960 - 200 = 760, right = 960 + 200 = 1160
            // top = 540 - 100 = 440, bottom = 540 + 100 = 640
            expect(aabb.left).toBeCloseTo(760);
            expect(aabb.right).toBeCloseTo(1160);
            expect(aabb.centerX).toBeCloseTo(960);
            expect(aabb.top).toBeCloseTo(440);
            expect(aabb.bottom).toBeCloseTo(640);
            expect(aabb.centerY).toBeCloseTo(540);
        });

        it('returns null if entity or transform is missing', () => {
            expect(calculateEntityAABB(null)).toBeNull();
            expect(calculateEntityAABB({})).toBeNull();
            expect(calculateEntityAABB({ components: {} })).toBeNull();
        });
    });

    describe('findSnapAdjustment - X Axis Precision Snapping', () => {
        const startBounds = {
            left: 100,
            right: 300,
            centerX: 200,
            top: 100,
            bottom: 200,
            centerY: 150,
            width: 200,
            height: 100
        };

        it('snaps Left-to-Left when within threshold', () => {
            const candidates = [
                { id: 'ref-1', left: 150, right: 350, centerX: 250, top: 300, bottom: 400, centerY: 350 }
            ];

            // rawDx = 48 -> unsnapped left = 148 (dist to 150 is 2, <= 6)
            const result = findSnapAdjustment({
                startBounds,
                rawDx: 48,
                rawDy: 0,
                candidates,
                threshold: 6
            });

            expect(result.dx).toBe(50); // 48 + 2
            expect(result.guides).toHaveLength(1);
            expect(result.guides[0].type).toBe('vertical');
            expect(result.guides[0].x).toBe(150);
        });

        it('snaps Center-to-Center when within threshold', () => {
            const candidates = [
                { id: 'ref-1', left: 180, right: 320, centerX: 250, top: 300, bottom: 400, centerY: 350 }
            ];

            // rawDx = 52 -> unsnapped centerX = 252 (dist to 250 is 2, <= 6)
            const result = findSnapAdjustment({
                startBounds,
                rawDx: 52,
                rawDy: 0,
                candidates,
                threshold: 6
            });

            expect(result.dx).toBe(50); // 52 - 2
            expect(result.guides[0].type).toBe('vertical');
            expect(result.guides[0].x).toBe(250);
        });

        it('snaps Right-to-Right when within threshold', () => {
            const candidates = [
                { id: 'ref-1', left: 250, right: 400, centerX: 325, top: 300, bottom: 400, centerY: 350 }
            ];

            // rawDx = 97 -> unsnapped right = 397 (dist to 400 is 3, <= 6)
            const result = findSnapAdjustment({
                startBounds,
                rawDx: 97,
                rawDy: 0,
                candidates,
                threshold: 6
            });

            expect(result.dx).toBe(100);
            expect(result.guides[0].x).toBe(400);
        });

        it('snaps Left-to-Right touching edges (adjacent snapping)', () => {
            const candidates = [
                { id: 'ref-1', left: 0, right: 100, centerX: 50, top: 100, bottom: 200, centerY: 150 }
            ];

            // rawDx = -2 -> unsnapped left = 98 (dist to ref.right=100 is 2)
            const result = findSnapAdjustment({
                startBounds,
                rawDx: -2,
                rawDy: 0,
                candidates,
                threshold: 6
            });

            expect(result.dx).toBe(0);
            expect(result.guides[0].x).toBe(100);
        });

        it('does NOT snap if distance exceeds threshold', () => {
            const candidates = [
                { id: 'ref-1', left: 150, right: 350, centerX: 250, top: 300, bottom: 400, centerY: 350 }
            ];

            // rawDx = 40 -> unsnapped left = 140 (dist to 150 is 10 > 6)
            const result = findSnapAdjustment({
                startBounds,
                rawDx: 40,
                rawDy: 0,
                candidates,
                threshold: 6
            });

            expect(result.dx).toBe(40);
            expect(result.guides).toHaveLength(0);
        });
    });

    describe('findSnapAdjustment - Y Axis Precision Snapping', () => {
        const startBounds = {
            left: 100,
            right: 300,
            centerX: 200,
            top: 100,
            bottom: 200,
            centerY: 150,
            width: 200,
            height: 100
        };

        it('snaps Top-to-Top when within threshold', () => {
            const candidates = [
                { id: 'ref-1', left: 400, right: 600, centerX: 500, top: 250, bottom: 350, centerY: 300 }
            ];

            // rawDy = 149 -> unsnapped top = 249 (dist to 250 is 1)
            const result = findSnapAdjustment({
                startBounds,
                rawDx: 0,
                rawDy: 149,
                candidates,
                threshold: 6
            });

            expect(result.dy).toBe(150);
            expect(result.guides).toHaveLength(1);
            expect(result.guides[0].type).toBe('horizontal');
            expect(result.guides[0].y).toBe(250);
        });

        it('snaps Center-to-Center on Y axis', () => {
            const candidates = [
                { id: 'ref-1', left: 400, right: 600, centerX: 500, top: 200, bottom: 400, centerY: 300 }
            ];

            // rawDy = 153 -> unsnapped centerY = 303 (dist to 300 is 3)
            const result = findSnapAdjustment({
                startBounds,
                rawDx: 0,
                rawDy: 153,
                candidates,
                threshold: 6
            });

            expect(result.dy).toBe(150);
            expect(result.guides[0].type).toBe('horizontal');
            expect(result.guides[0].y).toBe(300);
        });

        it('snaps Bottom-to-Bottom on Y axis', () => {
            const candidates = [
                { id: 'ref-1', left: 400, right: 600, centerX: 500, top: 200, bottom: 400, centerY: 300 }
            ];

            // rawDy = 198 -> unsnapped bottom = 398 (dist to 400 is 2)
            const result = findSnapAdjustment({
                startBounds,
                rawDx: 0,
                rawDy: 198,
                candidates,
                threshold: 6
            });

            expect(result.dy).toBe(200);
            expect(result.guides[0].y).toBe(400);
        });
    });

    describe('findSnapAdjustment - Canvas Viewport Snapping', () => {
        const startBounds = {
            left: 100,
            right: 300,
            centerX: 200,
            top: 100,
            bottom: 200,
            centerY: 150,
            width: 200,
            height: 100
        };

        const canvasBounds = {
            id: '__canvas__',
            isCanvas: true,
            left: 0,
            centerX: 960,
            right: 1920,
            top: 0,
            centerY: 540,
            bottom: 1080,
            width: 1920,
            height: 1080
        };

        it('snaps to canvas left border (0) and top border (0)', () => {
            // rawDx = -98 -> unsnapped left = 2 (dist to 0 is 2)
            // rawDy = -102 -> unsnapped top = -2 (dist to 0 is 2)
            const result = findSnapAdjustment({
                startBounds,
                rawDx: -98,
                rawDy: -102,
                canvasBounds,
                threshold: 6
            });

            expect(result.dx).toBe(-100);
            expect(result.dy).toBe(-100);
            expect(result.guides).toHaveLength(2);

            const vGuide = result.guides.find(g => g.type === 'vertical');
            const hGuide = result.guides.find(g => g.type === 'horizontal');

            expect(vGuide.x).toBe(0);
            expect(vGuide.y1).toBe(0);
            expect(vGuide.y2).toBe(1080); // Full canvas height

            expect(hGuide.y).toBe(0);
            expect(hGuide.x1).toBe(0);
            expect(hGuide.x2).toBe(1920); // Full canvas width
        });

        it('snaps to canvas dead-center (960, 540)', () => {
            // unsnapped center: centerX = 200 + 758 = 958 (dist to 960 is 2)
            // unsnapped center: centerY = 150 + 391 = 541 (dist to 540 is 1)
            const result = findSnapAdjustment({
                startBounds,
                rawDx: 758,
                rawDy: 391,
                canvasBounds,
                threshold: 6
            });

            expect(result.dx).toBe(760);
            expect(result.dy).toBe(390);

            const vGuide = result.guides.find(g => g.type === 'vertical');
            const hGuide = result.guides.find(g => g.type === 'horizontal');

            expect(vGuide.x).toBe(960);
            expect(hGuide.y).toBe(540);
        });

        it('snaps to canvas right and bottom edges', () => {
            // right edge = 300 + 1621 = 1921 (dist to 1920 is 1)
            // bottom edge = 200 + 878 = 1078 (dist to 1080 is 2)
            const result = findSnapAdjustment({
                startBounds,
                rawDx: 1621,
                rawDy: 878,
                canvasBounds,
                threshold: 6
            });

            expect(result.dx).toBe(1620);
            expect(result.dy).toBe(880);

            const vGuide = result.guides.find(g => g.type === 'vertical');
            const hGuide = result.guides.find(g => g.type === 'horizontal');

            expect(vGuide.x).toBe(1920);
            expect(hGuide.y).toBe(1080);
        });
    });

    describe('findResizeSnapAdjustment', () => {
        const startBounds = {
            left: 100,
            right: 300,
            centerX: 200,
            top: 100,
            bottom: 200,
            centerY: 150,
            width: 200,
            height: 100
        };

        it('snaps right edge during east (e) resize', () => {
            const candidates = [
                { id: 'ref-1', left: 450, right: 600, centerX: 525, top: 100, bottom: 200, centerY: 150 }
            ];

            // rawDx = 148 -> currentRight = 448 (dist to 450 is 2)
            const result = findResizeSnapAdjustment({
                startBounds,
                rawDx: 148,
                rawDy: 0,
                resizeType: 'e',
                candidates,
                threshold: 6
            });

            expect(result.dx).toBe(150);
            expect(result.guides).toHaveLength(1);
            expect(result.guides[0].type).toBe('vertical');
            expect(result.guides[0].x).toBe(450);
        });

        it('snaps both axes during south-east (se) corner resize', () => {
            const candidates = [
                { id: 'ref-1', left: 500, right: 600, centerX: 550, top: 350, bottom: 450, centerY: 400 }
            ];

            // currentRight: 300 + 198 = 498 (snap to 500)
            // currentBottom: 200 + 152 = 352 (snap to 350)
            const result = findResizeSnapAdjustment({
                startBounds,
                rawDx: 198,
                rawDy: 152,
                resizeType: 'se',
                candidates,
                threshold: 6
            });

            expect(result.dx).toBe(200);
            expect(result.dy).toBe(150);
            expect(result.guides).toHaveLength(2);
        });
    });

    describe('UISmartGuides Class', () => {
        let mockWorld;
        let mockGame;
        let smartGuides;

        beforeEach(() => {
            mockWorld = {
                settings: {
                    ui: { width: 1920, height: 1080, smartGuides: true }
                },
                layersUI: [
                    {
                        active: true,
                        visible: true,
                        entities: [
                            {
                                id: 'ent-sibling',
                                active: true,
                                visible: true,
                                components: {
                                    UITransform: {
                                        anchorX: 0, anchorY: 0,
                                        x: 500, y: 100, width: 200, height: 100,
                                        pivotX: 0, pivotY: 0, rotation: 0
                                    }
                                }
                            }
                        ]
                    }
                ]
            };

            mockGame = {
                camera: { scale: 1 }
            };

            smartGuides = new UISmartGuides(mockWorld, mockGame, null);
        });

        it('initializes candidates and excludes selected entity and its descendants', () => {
            const draggedEntity = {
                id: 'ent-dragged',
                active: true,
                visible: true,
                components: {
                    UITransform: {
                        anchorX: 0, anchorY: 0,
                        x: 100, y: 100, width: 100, height: 100,
                        pivotX: 0, pivotY: 0, rotation: 0
                    }
                }
            };

            const childEntity = {
                id: 'ent-child',
                parentId: 'ent-dragged',
                active: true,
                visible: true,
                components: {
                    UITransform: { x: 10, y: 10, width: 20, height: 20 }
                }
            };

            mockWorld.layersUI[0].entities.push(draggedEntity, childEntity);

            smartGuides.beginDrag([draggedEntity]);

            expect(smartGuides.startBounds).not.toBeNull();
            expect(smartGuides.startBounds.left).toBe(100);
            // Sibling should be in candidates, but dragged and child should NOT be in candidates
            expect(smartGuides.candidates).toHaveLength(1);
            expect(smartGuides.candidates[0].id).toBe('ent-sibling');
        });

        it('draws guide lines using selection blue color [0, 0.6, 1, 1]', () => {
            smartGuides.activeGuides = [
                { type: 'vertical', x: 500, y1: 50, y2: 300 },
                { type: 'horizontal', y: 200, x1: 50, x2: 600 }
            ];

            const mockShape = {
                drawLine: vi.fn()
            };

            smartGuides.draw(mockShape, {});

            expect(mockShape.drawLine).toHaveBeenCalledTimes(2);
            expect(mockShape.drawLine).toHaveBeenCalledWith(
                500, 50, 500, 300,
                [0, 0.6, 1, 1],
                2,
                {}
            );
            expect(mockShape.drawLine).toHaveBeenCalledWith(
                50, 200, 600, 200,
                [0, 0.6, 1, 1],
                2,
                {}
            );
        });

        it('clears active guides upon clear()', () => {
            smartGuides.activeGuides = [{ type: 'vertical', x: 100, y1: 0, y2: 100 }];
            smartGuides.clear();
            expect(smartGuides.activeGuides).toHaveLength(0);
            expect(smartGuides.startBounds).toBeNull();
            expect(smartGuides.candidates).toHaveLength(0);
        });
    });

    describe('TransformMediator - UI Tab Smart Guides Integration', () => {
        let mockWorld;
        let mockGame;
        let mockInput;
        let mediator;
        let smartGuides;

        beforeEach(() => {
            mockWorld = {
                settings: {
                    ui: { width: 1920, height: 1080, smartGuides: true },
                    grid: { snap: true, width: 32 }
                },
                layersUI: [
                    {
                        entities: [
                            {
                                id: 'ent-1',
                                active: true,
                                visible: true,
                                components: {
                                    UITransform: { x: 100, y: 100, width: 100, height: 100 }
                                }
                            }
                        ]
                    }
                ],
                _editors: {
                    activeTabId: 'ui',
                    tabs: [{ id: 'ui', type: 'ui' }]
                }
            };

            mockGame = {
                camera: { scale: 1 }
            };

            mockInput = {
                keyboard: { isDown: vi.fn().mockReturnValue(false) }
            };

            smartGuides = new UISmartGuides(mockWorld, mockGame, null);
            mediator = new TransformMediator(mockWorld, mockGame, mockInput, smartGuides);
        });

        it('snaps translation when in UI mode and smartGuides is enabled', () => {
            const entity = mockWorld.layersUI[0].entities[0];
            smartGuides.startBounds = {
                left: 100, right: 200, centerX: 150, top: 100, bottom: 200, centerY: 150, width: 100, height: 100
            };
            smartGuides.canvasBounds = {
                id: '__canvas__', isCanvas: true,
                left: 0, centerX: 960, right: 1920, top: 0, centerY: 540, bottom: 1080
            };
            smartGuides.candidates = [
                { id: 'ref-btn', left: 250, right: 350, centerX: 300, top: 300, bottom: 400, centerY: 350 }
            ];

            const startData = [{ e: entity, x: 100, y: 100 }];
            // rawDx = 148 -> unsnapped left = 248 (dist to ref.left=250 is 2, snaps to 250)
            mediator.processMove({ x: 248, y: 100 }, { x: 100, y: 100 }, startData, [entity], true);

            expect(entity.components.UITransform.x).toBe(250); // 100 + 150 (snapped from 148 to 150)
            expect(smartGuides.activeGuides).toHaveLength(1);
            expect(smartGuides.activeGuides[0].x).toBe(250);
        });

        it('does NOT snap when smartGuides is disabled in UI settings', () => {
            mockWorld.settings.ui.smartGuides = false;
            const entity = mockWorld.layersUI[0].entities[0];
            smartGuides.startBounds = {
                left: 100, right: 200, centerX: 150, top: 100, bottom: 200, centerY: 150, width: 100, height: 100
            };
            smartGuides.candidates = [
                { id: 'ref-btn', left: 250, right: 350, centerX: 300, top: 300, bottom: 400, centerY: 350 }
            ];

            const startData = [{ e: entity, x: 100, y: 100 }];
            mediator.processMove({ x: 248, y: 100 }, { x: 100, y: 100 }, startData, [entity], true);

            // Free-form movement: 100 + 148 = 248
            expect(entity.components.UITransform.x).toBe(248);
            expect(smartGuides.activeGuides).toHaveLength(0);
        });

        it('bypasses smart guides when Control key is held down in UI mode', () => {
            mockInput.keyboard.isDown.mockImplementation(key => key === 'Control');
            const entity = mockWorld.layersUI[0].entities[0];
            smartGuides.startBounds = {
                left: 100, right: 200, centerX: 150, top: 100, bottom: 200, centerY: 150, width: 100, height: 100
            };
            smartGuides.candidates = [
                { id: 'ref-btn', left: 250, right: 350, centerX: 300, top: 300, bottom: 400, centerY: 350 }
            ];

            const startData = [{ e: entity, x: 100, y: 100 }];
            mediator.processMove({ x: 248, y: 100 }, { x: 100, y: 100 }, startData, [entity], true);

            // Bypassed: moved freely to 248
            expect(entity.components.UITransform.x).toBe(248);
            expect(smartGuides.activeGuides).toHaveLength(0);
        });

        it('does NOT use smart guides in Scene mode (uses grid snap instead)', () => {
            const entity = {
                id: 'world-ent',
                components: { Transform: { x: 10, y: 10 } }
            };
            const startData = [{ e: entity, x: 10, y: 10 }];

            // isUIMode = false -> Grid snapping (gridSize: 32)
            mediator.processMove({ x: 45, y: 10 }, { x: 10, y: 10 }, startData, [entity], false);

            // 10 + 35 = 45 -> snaps to nearest 32: 32. finalDx = 32 - 10 = 22. newX = 10 + 22 = 32
            expect(entity.components.Transform.x).toBe(32);
            expect(smartGuides.activeGuides).toHaveLength(0);
        });
    });
});
