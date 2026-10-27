import { describe, it, expect, vi } from 'vitest';
import { SelectionHit } from '@core/Editor/Selection/SelectionHit.js';
import { SelectionRenderer } from '@core/Editor/Selection/SelectionRenderer.js';
import { TransformEngine } from '@core/Editor/Transform/TransformEngine.js';
import PointerRaycast from '@core/System/PointerRaycast.js';

describe('Selection & Hit Test Calculations Unit Tests', () => {
    const createMockWorld = (layersWorld = [], layersUI = [], uiSettings = { width: 1920, height: 1080 }) => ({
        layersWorld,
        layersUI,
        settings: {
            ui: uiSettings
        }
    });

    const createMockGame = (world, cameraScale = 1, cameraX = 0, cameraY = 0) => ({
        world,
        camera: { scale: cameraScale, x: cameraX, y: cameraY },
        selection: { filter: null }
    });

    describe('SelectionHit - _isPointInEntity Calculations', () => {
        it('tests axis-aligned entity with center pivot', () => {
            const entity = {
                id: 'e1',
                visible: true,
                components: {
                    Transform: {
                        x: 100, y: 100, width: 80, height: 60,
                        rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5
                    }
                }
            };
            const world = createMockWorld([{ entities: [entity] }]);
            const engine = new TransformEngine(world);
            const hit = new SelectionHit(createMockGame(world), engine);

            // Bounds: [100 - 40, 100 + 40] = [60, 140], [100 - 30, 100 + 30] = [70, 130]
            // Center
            expect(hit._isPointInEntity(100, 100, entity, null)).toBe(true);
            // Near edges inside
            expect(hit._isPointInEntity(65, 75, entity, null)).toBe(true);
            expect(hit._isPointInEntity(135, 125, entity, null)).toBe(true);
            // Clearly outside
            expect(hit._isPointInEntity(50, 100, entity, null)).toBe(false);
            expect(hit._isPointInEntity(100, 140, entity, null)).toBe(false);
        });

        it('verifies 5px buffer tolerance around entity edges', () => {
            const entity = {
                id: 'e1',
                visible: true,
                components: {
                    Transform: {
                        x: 100, y: 100, width: 50, height: 50,
                        rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0, pivotY: 0
                    }
                }
            };
            const world = createMockWorld([{ entities: [entity] }]);
            const engine = new TransformEngine(world);
            const hit = new SelectionHit(createMockGame(world), engine);

            // Pivot (0, 0): bounds are [100..150] x [100..150]
            // With 5px buffer: [95..155] x [95..155]
            expect(hit._isPointInEntity(96, 100, entity, null)).toBe(true);  // 4px outside left -> within buffer
            expect(hit._isPointInEntity(93, 100, entity, null)).toBe(false); // 7px outside left -> outside buffer
            expect(hit._isPointInEntity(154, 150, entity, null)).toBe(true); // 4px outside right -> within buffer
            expect(hit._isPointInEntity(158, 150, entity, null)).toBe(false); // 8px outside right -> outside buffer
        });

        it('tests rotated entity hit testing using inverse rotation', () => {
            const entity = {
                id: 'e1',
                visible: true,
                components: {
                    Transform: {
                        x: 0, y: 0, width: 100, height: 20,
                        rotation: 90, // Rotated 90 deg clockwise
                        scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5
                    }
                }
            };
            const world = createMockWorld([{ entities: [entity] }]);
            const engine = new TransformEngine(world);
            const hit = new SelectionHit(createMockGame(world), engine);

            // An unrotated 100x20 entity spans X: [-50..50], Y: [-10..10]
            // Rotated 90 deg clockwise, it spans X: [-10..10], Y: [-50..50]
            // Point (0, 40) is inside rotated entity
            expect(hit._isPointInEntity(0, 40, entity, null)).toBe(true);
            // Point (40, 0) was inside before rotation, but is OUTSIDE after 90 deg rotation
            expect(hit._isPointInEntity(40, 0, entity, null)).toBe(false);
        });

        it('tests scaled and flipped entity hit testing', () => {
            const entity = {
                id: 'e1',
                visible: true,
                components: {
                    Transform: {
                        x: 100, y: 100, width: 50, height: 50,
                        rotation: 0, scaleX: 2, scaleY: 2, pivotX: 0, pivotY: 0,
                        flipX: false, flipY: false
                    }
                }
            };
            const world = createMockWorld([{ entities: [entity] }]);
            const engine = new TransformEngine(world);
            const hit = new SelectionHit(createMockGame(world), engine);

            // Scaled 2x: bounds are [100..200] x [100..200]
            expect(hit._isPointInEntity(180, 180, entity, null)).toBe(true);

            // FlipX true: extends to the left from pivot (100) -> [0..100]
            entity.components.Transform.flipX = true;
            expect(hit._isPointInEntity(50, 120, entity, null)).toBe(true);
            expect(hit._isPointInEntity(180, 120, entity, null)).toBe(false);
        });

        it('tests custom non-standard pivot point hit testing', () => {
            const entity = {
                id: 'e1',
                visible: true,
                components: {
                    Transform: {
                        x: 200, y: 200, width: 100, height: 100,
                        pivotX: 1.0, pivotY: 1.0, // Pivot at bottom-right corner
                        rotation: 0, scaleX: 1, scaleY: 1
                    }
                }
            };
            const world = createMockWorld([{ entities: [entity] }]);
            const engine = new TransformEngine(world);
            const hit = new SelectionHit(createMockGame(world), engine);

            // Pivot is at bottom-right (200, 200), so entity occupies [100..200] x [100..200]
            expect(hit._isPointInEntity(150, 150, entity, null)).toBe(true);
            expect(hit._isPointInEntity(250, 250, entity, null)).toBe(false);
        });

        it('tests tilemap entity hit calculation based on sparse tile bounds', () => {
            const tilemapEntity = {
                id: 'tm-1',
                visible: true,
                components: {
                    Transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
                    Tilemap: {
                        width: 32,
                        height: 32,
                        data: {
                            '2,2': 1,
                            '4,3': 1
                        }
                    }
                }
            };
            const world = createMockWorld([{ entities: [tilemapEntity] }]);
            const engine = new TransformEngine(world);
            const hit = new SelectionHit(createMockGame(world), engine);

            // Tiles minX=2, maxX=4 -> pixel X: [2*32, (4+1)*32] = [64, 160]
            // Tiles minY=2, maxY=3 -> pixel Y: [2*32, (3+1)*32] = [64, 128]
            expect(hit._isPointInEntity(100, 100, tilemapEntity, null)).toBe(true);
            expect(hit._isPointInEntity(10, 10, tilemapEntity, null)).toBe(false);
        });
    });

    describe('SelectionHit - Hit Query Orchestration & Layer Sorting', () => {
        it('prioritizes layer with higher zIndex and orderIndex', () => {
            const eBottom = {
                id: 'e-bottom',
                visible: true,
                components: { Transform: { x: 0, y: 0, width: 100, height: 100 } }
            };
            const eTop = {
                id: 'e-top',
                visible: true,
                components: { Transform: { x: 0, y: 0, width: 100, height: 100 } }
            };
            const layer1 = { zIndex: 0, orderIndex: 0, entities: [eBottom] };
            const layer2 = { zIndex: 10, orderIndex: 0, entities: [eTop] };

            const world = createMockWorld([layer1, layer2]);
            const engine = new TransformEngine(world);
            const game = createMockGame(world);
            const hit = new SelectionHit(game, engine);

            const selected = hit.hit(world, 50, 50, 50, 50);
            expect(selected.id).toBe('e-top');
        });

        it('prioritizes entity with higher zIndex within the same layer', () => {
            const eLower = {
                id: 'e-lower',
                zIndex: 1,
                visible: true,
                components: { Transform: { x: 0, y: 0, width: 100, height: 100 } }
            };
            const eHigher = {
                id: 'e-higher',
                zIndex: 5,
                visible: true,
                components: { Transform: { x: 0, y: 0, width: 100, height: 100 } }
            };
            const layer = { zIndex: 0, entities: [eLower, eHigher] };
            const world = createMockWorld([layer]);
            const engine = new TransformEngine(world);
            const game = createMockGame(world);
            const hit = new SelectionHit(game, engine);

            const selected = hit.hit(world, 50, 50, 50, 50);
            expect(selected.id).toBe('e-higher');
        });

        it('ignores inactive, invisible, or locked layers and entities', () => {
            const lockedEntity = {
                id: 'locked-ent',
                locked: true,
                visible: true,
                components: { Transform: { x: 0, y: 0, width: 100, height: 100 } }
            };
            const invisibleEntity = {
                id: 'invis-ent',
                visible: false,
                components: { Transform: { x: 0, y: 0, width: 100, height: 100 } }
            };
            const validEntity = {
                id: 'valid-ent',
                visible: true,
                components: { Transform: { x: 0, y: 0, width: 100, height: 100 } }
            };

            const lockedLayer = { locked: true, entities: [validEntity] };
            const invisibleLayer = { visible: false, entities: [validEntity] };
            const normalLayer = { entities: [lockedEntity, invisibleEntity, validEntity] };

            const world = createMockWorld([lockedLayer, invisibleLayer, normalLayer]);
            const engine = new TransformEngine(world);
            const game = createMockGame(world);
            const hit = new SelectionHit(game, engine);

            const selected = hit.hit(world, 50, 50, 50, 50);
            expect(selected.id).toBe('valid-ent');
        });

        it('respects custom selection filter callback', () => {
            const e1 = { id: 'e1', type: 'character', visible: true, components: { Transform: { x: 0, y: 0, width: 50, height: 50 } } };
            const e2 = { id: 'e2', type: 'prop', visible: true, components: { Transform: { x: 0, y: 0, width: 50, height: 50 } } };
            const layer = { entities: [e1, e2] };
            const world = createMockWorld([layer]);

            const engine = new TransformEngine(world);
            const game = createMockGame(world);
            // Only select props
            game.selection.filter = (e) => e.type === 'prop';
            const hit = new SelectionHit(game, engine);

            const selected = hit.hit(world, 25, 25, 25, 25);
            expect(selected.id).toBe('e2');
        });
    });

    describe('SelectionHit - Marquee Selection Calculations', () => {
        it('identifies entities overlapping the marquee bounding box', () => {
            const eInside = {
                id: 'e-inside',
                visible: true,
                components: { Transform: { x: 100, y: 100, width: 40, height: 40 } }
            };
            const ePartial = {
                id: 'e-partial',
                visible: true,
                components: { Transform: { x: 180, y: 100, width: 40, height: 40 } }
            };
            const eOutside = {
                id: 'e-outside',
                visible: true,
                components: { Transform: { x: 300, y: 300, width: 40, height: 40 } }
            };

            const layer = { entities: [eInside, ePartial, eOutside] };
            const world = createMockWorld([layer]);
            const engine = new TransformEngine(world);
            const game = createMockGame(world);
            const hit = new SelectionHit(game, engine);

            // Marquee from (80, 80) with w=110, h=50 -> spans [80..190] x [80..130]
            const marqueeBox = { x: 80, y: 80, w: 110, h: 50 };
            const selected = hit.checkMarquee(world, marqueeBox);

            const ids = selected.map(e => e.id);
            expect(ids).toContain('e-inside');
            expect(ids).toContain('e-partial');
            expect(ids).not.toContain('e-outside');
        });
    });

    describe('SelectionRenderer - Drawing Calculations', () => {
        it('calls drawLine 4 times to render oriented bounding box (OBB)', () => {
            const entity = {
                id: 'e1',
                visible: true,
                components: {
                    Transform: { x: 50, y: 50, width: 100, height: 80, rotation: 0 }
                }
            };
            const world = createMockWorld([{ entities: [entity] }]);
            const engine = new TransformEngine(world);
            const game = createMockGame(world);
            const renderer = new SelectionRenderer(game, engine);

            const drawnLines = [];
            const mockShape = {
                drawLine: vi.fn((x1, y1, x2, y2, color, thickness) => {
                    drawnLines.push({ x1, y1, x2, y2, color, thickness });
                })
            };

            renderer.drawObb(mockShape, entity, [0, 0.6, 1, 1], null, 2);

            expect(mockShape.drawLine).toHaveBeenCalledTimes(4);
            expect(drawnLines.length).toBe(4);
        });

        it('draws hover outline for unselected hovered entity and selection outline for selected', () => {
            const eHover = {
                id: 'hovered',
                visible: true,
                components: { Transform: { x: 0, y: 0, width: 50, height: 50 } }
            };
            const eSelect = {
                id: 'selected',
                visible: true,
                components: { Transform: { x: 100, y: 100, width: 50, height: 50 } }
            };

            const world = createMockWorld([{ entities: [eHover, eSelect] }]);
            const engine = new TransformEngine(world);
            const game = createMockGame(world);
            const renderer = new SelectionRenderer(game, engine);

            const drawnColors = [];
            const mockShape = {
                drawLine: vi.fn((x1, y1, x2, y2, color) => {
                    drawnColors.push(color);
                })
            };

            renderer.draw(mockShape, null, [eSelect], eHover, null);

            // 4 lines for hovered (color with 0.5 alpha) + 4 lines for selected
            expect(drawnColors.length).toBe(8);
            expect(drawnColors[0]).toEqual([1, 1, 1, 0.5]); // hover color
            expect(drawnColors[4]).toEqual([0, 0.6, 1, 1]);  // select color
        });

        it('renders marquee selection overlay box with border lines', () => {
            const world = createMockWorld();
            const engine = new TransformEngine(world);
            const game = createMockGame(world);
            const renderer = new SelectionRenderer(game, engine);

            const drawnLines = [];
            let filledPoly = null;
            const mockShape = {
                _fillConvexPolygon: vi.fn((quad, color) => { filledPoly = { quad, color }; }),
                drawLine: vi.fn((x1, y1, x2, y2) => { drawnLines.push({ x1, y1, x2, y2 }); })
            };

            const marqueeBox = { x: 10, y: 20, w: 100, h: 80 };
            renderer.draw(mockShape, null, [], null, marqueeBox);

            expect(mockShape._fillConvexPolygon).toHaveBeenCalledTimes(1);
            expect(filledPoly.quad.length).toBe(4);
            expect(mockShape.drawLine).toHaveBeenCalledTimes(4);
        });
    });

    describe('PointerRaycast - Coordinate Unprojection & Collider Calculations', () => {
        it('transforms pointer to world coordinates using camera scale and position', () => {
            const entity = {
                id: 'ent-1',
                active: true,
                visible: true,
                components: {
                    Transform: { x: 200, y: 200, width: 100, height: 100, rotation: 0 }
                }
            };
            const world = {
                settings: { ui: { width: 1920, height: 1080 } },
                layersWorld: [{ visible: true, entities: [entity] }],
                layersUI: [],
                entities: [entity]
            };

            // Canvas is 1920x1080, center is (960, 540)
            // Camera at (100, 100), scale = 2
            // Pointer at (960, 540) is exactly at canvas center -> maps to camera (100, 100)
            const game = {
                world,
                camera: { x: 100, y: 100, scale: 2 },
                input: { getPointer: () => ({ x: 960, y: 540 }) },
                renderer: { canvas: { width: 1920, height: 1080 } }
            };

            // Check top entity: at world (100, 100), entity is at (200, 200) -> should NOT hit
            expect(PointerRaycast.getTopEntityUnderPointer(game)).toBeNull();

            // Pointer offset to match entity center:
            // worldX = 200 -> camera.x + (pointer.x - 960)/2 = 200 -> pointer.x - 960 = 200 -> pointer.x = 1160
            // worldY = 200 -> pointer.y = 740
            game.input.getPointer = () => ({ x: 1160, y: 740 });
            expect(PointerRaycast.getTopEntityUnderPointer(game)?.id).toBe('ent-1');
        });

        it('hits entity with custom Collider data offset and dimensions', () => {
            const entity = {
                id: 'ent-collider',
                active: true,
                visible: true,
                components: {
                    Transform: { x: 0, y: 0, width: 100, height: 100 },
                    Collider: {
                        data: [
                            {
                                enabled: true,
                                autoFit: false,
                                width: 40,
                                height: 40,
                                offsetX: 200, // Collider offset to the right
                                offsetY: 30,  // Offsets from top-left (-50 + 30 + 20 = 0) so worldPy is 0
                                pivotX: 0.5,
                                pivotY: 0.5
                            }
                        ]
                    }
                }
            };
            const world = {
                settings: { ui: { width: 1920, height: 1080 } },
                layersWorld: [{ visible: true, entities: [entity] }],
                layersUI: [],
                entities: [entity]
            };
            const game = {
                world,
                camera: { x: 0, y: 0, scale: 1 },
                input: { getPointer: () => ({ x: 960, y: 540 }) }, // Pointer at world (0, 0)
                renderer: { canvas: { width: 1920, height: 1080 } }
            };

            // At world (0, 0), the transform center is here, but collider is offset to x=170 -> should miss
            expect(PointerRaycast.getTopEntityUnderPointer(game)).toBeNull();

            // Pointing at collider world center (170, 0) -> canvas (960 + 170, 540) = (1130, 540)
            game.input.getPointer = () => ({ x: 1130, y: 540 });
            expect(PointerRaycast.getTopEntityUnderPointer(game)?.id).toBe('ent-collider');
        });

        it('ignores entities with visible: false or active: false and hits visible/active entity underneath', () => {
            const entUnderneath = {
                id: 'ent-underneath',
                active: true,
                visible: true,
                zIndex: 1,
                components: {
                    Transform: { x: 0, y: 0, width: 100, height: 100 }
                }
            };
            const entBlocking = {
                id: 'ent-blocking',
                active: true,
                visible: false, // Invisible blocker
                zIndex: 10,
                components: {
                    Transform: { x: 0, y: 0, width: 100, height: 100 }
                }
            };
            const world = {
                settings: { ui: { width: 1920, height: 1080 } },
                layersWorld: [{ visible: true, entities: [entBlocking, entUnderneath] }],
                layersUI: [],
                entities: [entBlocking, entUnderneath]
            };
            const game = {
                world,
                camera: { x: 0, y: 0, scale: 1 },
                input: { getPointer: () => ({ x: 960, y: 540 }) },
                renderer: { canvas: { width: 1920, height: 1080 } }
            };

            // Since entBlocking has visible: false, PointerRaycast should hit entUnderneath
            expect(PointerRaycast.getTopEntityUnderPointer(game)?.id).toBe('ent-underneath');

            // If entBlocking is visible but active: false, it should also pass through
            entBlocking.visible = true;
            entBlocking.active = false;
            expect(PointerRaycast.getTopEntityUnderPointer(game)?.id).toBe('ent-underneath');

            // If entBlocking becomes active and visible, it should block entUnderneath
            entBlocking.active = true;
            expect(PointerRaycast.getTopEntityUnderPointer(game)?.id).toBe('ent-blocking');
        });

        it('ignores layers with visible: false or active: false and hits layer underneath', () => {
            const entLayer1 = {
                id: 'ent-layer-1',
                active: true,
                visible: true,
                components: {
                    Transform: { x: 0, y: 0, width: 100, height: 100 }
                }
            };
            const entLayer2 = {
                id: 'ent-layer-2',
                active: true,
                visible: true,
                components: {
                    Transform: { x: 0, y: 0, width: 100, height: 100 }
                }
            };
            const layerTop = {
                id: 'layer-top',
                zIndex: 10,
                visible: false, // Invisible layer
                entities: [entLayer2]
            };
            const layerBottom = {
                id: 'layer-bottom',
                zIndex: 1,
                visible: true,
                entities: [entLayer1]
            };
            const world = {
                settings: { ui: { width: 1920, height: 1080 } },
                layersWorld: [layerTop, layerBottom],
                layersUI: [],
                entities: [entLayer2, entLayer1]
            };
            const game = {
                world,
                camera: { x: 0, y: 0, scale: 1 },
                input: { getPointer: () => ({ x: 960, y: 540 }) },
                renderer: { canvas: { width: 1920, height: 1080 } }
            };

            // Top layer is invisible -> raycast hits ent-layer-1 on bottom layer
            expect(PointerRaycast.getTopEntityUnderPointer(game)?.id).toBe('ent-layer-1');

            // Top layer is visible but inactive -> raycast hits ent-layer-1
            layerTop.visible = true;
            layerTop.active = false;
            expect(PointerRaycast.getTopEntityUnderPointer(game)?.id).toBe('ent-layer-1');

            // Top layer is visible and active -> raycast hits ent-layer-2
            layerTop.active = true;
            expect(PointerRaycast.getTopEntityUnderPointer(game)?.id).toBe('ent-layer-2');
        });
    });
});
