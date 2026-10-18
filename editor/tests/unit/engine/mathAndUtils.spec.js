import { describe, it, expect } from 'vitest';
import Mat4 from '@core/Util/Mat4.js';
import { calculateQuadVertices } from '@core/Util/calculateQuadVertices.js';
import { MapToCanvasPixels, CanvasToWorld } from '@core/Util/MapToCanvasPixels.js';
import Camera from '@core/Util/Camera.js';
import { HexToVec4 } from '@core/Util/HexToVec4.js';
import RenderUtils from '@core/Renderer/Scene/RenderUtils.js';
import FontMath from '@core/Util/FontMath.js';

describe('Engine Math, Matrix & Utility Calculations', () => {
    describe('Mat4 - 4x4 Matrix Mathematics', () => {
        it('creates and initializes identity matrix', () => {
            const m = Mat4.identity();
            expect(m.length).toBe(16);
            // Diagonal elements are 1
            expect(m[0]).toBe(1);
            expect(m[5]).toBe(1);
            expect(m[10]).toBe(1);
            expect(m[15]).toBe(1);
            // Off-diagonal elements are 0
            expect(m[1]).toBe(0);
            expect(m[4]).toBe(0);
            expect(m[12]).toBe(0);
        });

        it('copies matrix data accurately', () => {
            const src = new Float32Array([
                1, 2, 3, 4,
                5, 6, 7, 8,
                9, 10, 11, 12,
                13, 14, 15, 16
            ]);
            const dst = Mat4.create();
            Mat4.copy(dst, src);
            expect(Array.from(dst)).toEqual(Array.from(src));
        });

        it('translates matrix and modifies translation column', () => {
            const m = Mat4.identity();
            const out = Mat4.create();
            Mat4.translate(out, m, 10, 20, 30);

            // Translation is stored in elements 12, 13, 14
            expect(out[12]).toBe(10);
            expect(out[13]).toBe(20);
            expect(out[14]).toBe(30);
            expect(out[15]).toBe(1);
        });

        it('scales matrix diagonal elements', () => {
            const m = Mat4.identity();
            const out = Mat4.create();
            Mat4.scale(out, m, 2, 3, 4);

            expect(out[0]).toBe(2);
            expect(out[5]).toBe(3);
            expect(out[10]).toBe(4);
            expect(out[15]).toBe(1);
        });

        it('rotates matrix around Z axis', () => {
            const m = Mat4.identity();
            const out = Mat4.create();
            const rad = Math.PI / 2; // 90 degrees
            Mat4.rotateZ(out, m, rad);

            // cos(90) = 0, sin(90) = 1
            expect(out[0]).toBeCloseTo(0);
            expect(out[1]).toBeCloseTo(1);
            expect(out[4]).toBeCloseTo(-1);
            expect(out[5]).toBeCloseTo(0);
        });

        it('generates standard orthographic projection matrix', () => {
            const out = Mat4.create();
            // Left: 0, Right: 1920, Bottom: 1080, Top: 0
            Mat4.ortho(out, 0, 1920, 1080, 0, -1, 1);

            // out[0] = -2 / (left - right) = -2 / -1920 = 2 / 1920
            expect(out[0]).toBeCloseTo(2 / 1920);
            // out[5] = -2 / (bottom - top) = -2 / 1080
            expect(out[5]).toBeCloseTo(-2 / 1080);
            expect(out[12]).toBeCloseTo(-1);
            expect(out[13]).toBeCloseTo(1);
        });

        it('multiplies matrices correctly (associative and order preserved)', () => {
            const identity = Mat4.identity();
            const tMat = Mat4.translate(Mat4.create(), identity, 10, 20, 0);
            const out = Mat4.create();

            // Identity * T = T
            Mat4.multiply(out, identity, tMat);
            expect(out[12]).toBe(10);
            expect(out[13]).toBe(20);

            // T * Scale
            const sMat = Mat4.scale(Mat4.create(), identity, 2, 2, 1);
            const combined = Mat4.create();
            Mat4.multiply(combined, tMat, sMat);
            expect(combined[0]).toBe(2);
            expect(combined[5]).toBe(2);
            expect(combined[12]).toBe(10);
            expect(combined[13]).toBe(20);
        });
    });

    describe('calculateQuadVertices - 2D Quad Transformation', () => {
        it('calculates unrotated quad vertices with center pivot (0.5, 0.5)', () => {
            // Box 100x100 at (200, 200), rot 0, scale (1, 1), pivot (0.5, 0.5)
            const v = calculateQuadVertices(200, 200, 100, 100, 0, 1, 1, 0.5, 0.5);

            expect(v.tl.x).toBeCloseTo(150);
            expect(v.tl.y).toBeCloseTo(150);

            expect(v.tr.x).toBeCloseTo(250);
            expect(v.tr.y).toBeCloseTo(150);

            expect(v.bl.x).toBeCloseTo(150);
            expect(v.bl.y).toBeCloseTo(250);

            expect(v.br.x).toBeCloseTo(250);
            expect(v.br.y).toBeCloseTo(250);
        });

        it('calculates unrotated quad vertices with top-left pivot (0, 0)', () => {
            // Box 80x60 at (100, 100), pivot (0, 0)
            const v = calculateQuadVertices(100, 100, 80, 60, 0, 1, 1, 0, 0);

            expect(v.tl.x).toBeCloseTo(100);
            expect(v.tl.y).toBeCloseTo(100);

            expect(v.tr.x).toBeCloseTo(180);
            expect(v.tr.y).toBeCloseTo(100);

            expect(v.bl.x).toBeCloseTo(100);
            expect(v.bl.y).toBeCloseTo(160);

            expect(v.br.x).toBeCloseTo(180);
            expect(v.br.y).toBeCloseTo(160);
        });

        it('calculates quad vertices rotated 90 degrees around center pivot', () => {
            const rad = Math.PI / 2; // 90 deg
            // Box 100x50 at (0, 0)
            const v = calculateQuadVertices(0, 0, 100, 50, rad, 1, 1, 0.5, 0.5);

            // Unrotated local offsets from center:
            // tl: (-50, -25) rotated 90 deg -> (25, -50)
            // tr: (50, -25) rotated 90 deg -> (25, 50)
            // bl: (-50, 25) rotated 90 deg -> (-25, -50)
            // br: (50, 25) rotated 90 deg -> (-25, 50)
            expect(v.tl.x).toBeCloseTo(25);
            expect(v.tl.y).toBeCloseTo(-50);

            expect(v.tr.x).toBeCloseTo(25);
            expect(v.tr.y).toBeCloseTo(50);

            expect(v.bl.x).toBeCloseTo(-25);
            expect(v.bl.y).toBeCloseTo(-50);

            expect(v.br.x).toBeCloseTo(-25);
            expect(v.br.y).toBeCloseTo(50);
        });

        it('handles negative scales (flipX / flipY)', () => {
            // Scale sx = -1 inverts width direction
            const v = calculateQuadVertices(100, 100, 50, 50, 0, -1, 1, 0, 0);

            // Width extends from 100 to 50
            expect(v.tl.x).toBeCloseTo(100);
            expect(v.tr.x).toBeCloseTo(50);
            expect(v.bl.x).toBeCloseTo(100);
            expect(v.br.x).toBeCloseTo(50);
        });
    });

    describe('MapToCanvasPixels & CanvasToWorld Calculations', () => {
        it('CanvasToWorld maps canvas center to camera position', () => {
            const canvas = { width: 1920, height: 1080 };
            const camera = { x: 500, y: 300, scale: 1 };

            // Pointer at canvas center (960, 540)
            const worldP = CanvasToWorld(960, 540, camera, canvas);
            expect(worldP.x).toBe(500);
            expect(worldP.y).toBe(300);
        });

        it('CanvasToWorld scales world offsets based on camera zoom factor', () => {
            const canvas = { width: 1920, height: 1080 };
            const camera = { x: 0, y: 0, scale: 2 }; // 2x zoom in

            // 100 pixels away from center in canvas space = 50 world units
            const worldP = CanvasToWorld(1060, 640, camera, canvas);
            expect(worldP.x).toBe(50);
            expect(worldP.y).toBe(50);
        });

        it('MapToCanvasPixels handles client bounds ratio and clamps to canvas size', () => {
            const canvas = {
                width: 1920,
                height: 1080,
                getBoundingClientRect: () => ({ left: 10, top: 20, width: 960, height: 540 })
            };

            // Client mouse at (10, 20) -> px = 0, py = 0
            const p1 = MapToCanvasPixels({ clientX: 10, clientY: 20 }, canvas);
            expect(p1.px).toBe(0);
            expect(p1.py).toBe(0);

            // Client mouse at (490, 290) -> dx = 480 (half width) -> px = 960
            const p2 = MapToCanvasPixels({ clientX: 490, clientY: 290 }, canvas);
            expect(p2.px).toBe(960);
            expect(p2.py).toBe(540);

            // Mouse far outside is clamped within [0..1920] x [0..1080]
            const pClamp = MapToCanvasPixels({ clientX: 2000, clientY: 2000 }, canvas);
            expect(pClamp.px).toBe(1920);
            expect(pClamp.py).toBe(1080);
        });
    });

    describe('Camera - Snapping, Target Tracking & Bounds Clamping', () => {
        it('snapTo sets position instantly', () => {
            const cam = new Camera(0, 0);
            cam.snapTo(150, 250);
            expect(cam.x).toBe(150);
            expect(cam.y).toBe(250);
        });

        it('tracks target entity with first-frame instant snap followed by smooth lerp', () => {
            const target = {
                components: { Transform: { x: 100, y: 200 } }
            };
            const cam = new Camera(0, 0);
            cam.setTarget(target, 0.5, { x: 10, y: 20 });

            // First frame: instantly snaps to target + offset = (110, 220)
            cam.update(0.016, null, null);
            expect(cam.x).toBe(110);
            expect(cam.y).toBe(220);

            // Move target to (200, 200) -> desired is (210, 220)
            target.components.Transform.x = 200;
            // Next frame: lerps towards (210, 220)
            cam.update(0.016, null, null);
            expect(cam.x).toBeGreaterThan(110);
            expect(cam.x).toBeLessThan(210);
        });

        it('clamps camera within worldBounds when active', () => {
            const cam = new Camera(1000, 1000);
            cam.scale = 1;
            const canvas = { width: 800, height: 600 }; // view: 800x600, half: 400x300
            const world = {
                settings: {
                    worldBounds: {
                        active: true,
                        x1: 0, y1: 0, x2: 1000, y2: 1000
                    }
                }
            };

            cam.update(0.016, world, canvas);

            // With bounds [0..1000] and halfW = 400: maxX = 1000 - 400 = 600
            // With halfH = 300: maxY = 1000 - 300 = 700
            expect(cam.x).toBe(600);
            expect(cam.y).toBe(700);
        });
    });

    describe('HexToVec4 - Color Parsing & Caching', () => {
        it('parses 3, 6, and 8 hex character color strings into normalized RGBA vec4', () => {
            const white = HexToVec4('#fff');
            expect(white).toEqual([1, 1, 1, 1]);

            const red = HexToVec4('#ff0000');
            expect(red[0]).toBe(1);
            expect(red[1]).toBe(0);
            expect(red[2]).toBe(0);
            expect(red[3]).toBe(1);

            const semiTransparentBlue = HexToVec4('#0000ff80');
            expect(semiTransparentBlue[0]).toBe(0);
            expect(semiTransparentBlue[1]).toBe(0);
            expect(semiTransparentBlue[2]).toBe(1);
            expect(semiTransparentBlue[3]).toBeCloseTo(128 / 255);
        });

        it('caches parsed colors for high performance', () => {
            const v1 = HexToVec4('#123456');
            const v2 = HexToVec4('#123456');
            expect(v1).toBe(v2); // Same object reference from cache
        });
    });

    describe('RenderUtils - Item Sorting Calculations', () => {
        it('sorts entities ascending by zIndex, then orderIndex, then ID', () => {
            const items = [
                { id: 'b', zIndex: 1, orderIndex: 2 },
                { id: 'a', zIndex: 1, orderIndex: 1 },
                { id: 'c', zIndex: 0, orderIndex: 5 },
                { id: 'd', zIndex: 1, orderIndex: 1 }
            ];

            const sorted = RenderUtils.sortItems(items);
            // zIndex 0 comes first
            expect(sorted[0].id).toBe('c');
            // zIndex 1, orderIndex 1 (id 'a' vs id 'd')
            expect(sorted[1].id).toBe('a');
            expect(sorted[2].id).toBe('d');
            // zIndex 1, orderIndex 2
            expect(sorted[3].id).toBe('b');
        });

        it('enforces Hierarchical Stacking Context: Parent (z:0, o:0), Child (z:1, o:0), Pure (z:0, o:1)', () => {
            const entities = [
                { id: 'pure', zIndex: 0, orderIndex: 1, parentId: null },
                { id: 'child', zIndex: 1, orderIndex: 0, parentId: 'parent' },
                { id: 'parent', zIndex: 0, orderIndex: 0, parentId: null }
            ];

            const sorted = RenderUtils.getHierarchicalOrder(entities);
            expect(sorted.map(e => e.id)).toEqual(['parent', 'child', 'pure']);

            // sortItems also produces the identical result when hierarchy is present
            const sortedViaSortItems = RenderUtils.sortItems([...entities]);
            expect(sortedViaSortItems.map(e => e.id)).toEqual(['parent', 'child', 'pure']);
        });

        it('renders child behind parent when child zIndex is lower than parent', () => {
            const entities = [
                { id: 'pure', zIndex: 0, orderIndex: 1, parentId: null },
                { id: 'shadow_child', zIndex: -1, orderIndex: 0, parentId: 'parent' },
                { id: 'parent', zIndex: 0, orderIndex: 0, parentId: null }
            ];

            const sorted = RenderUtils.getHierarchicalOrder(entities);
            expect(sorted.map(e => e.id)).toEqual(['shadow_child', 'parent', 'pure']);
        });

        it('handles multi-level nested hierarchy stacking correctly', () => {
            const entities = [
                { id: 'other_root', zIndex: 0, orderIndex: 1, parentId: null },
                { id: 'grandparent', zIndex: 0, orderIndex: 0, parentId: null },
                { id: 'uncle', zIndex: 0, orderIndex: 1, parentId: 'grandparent' },
                { id: 'parent', zIndex: 0, orderIndex: 0, parentId: 'grandparent' },
                { id: 'child', zIndex: 0, orderIndex: 0, parentId: 'parent' }
            ];

            const sorted = RenderUtils.getHierarchicalOrder(entities);
            expect(sorted.map(e => e.id)).toEqual(['grandparent', 'parent', 'child', 'uncle', 'other_root']);
        });
    });

    describe('FontMath - Text Measurement and Wrapping', () => {
        const mockFont = {
            info: { size: 20 },
            common: { lineHeight: 24, base: 20, stdYMin: 0, stdYMax: 20 },
            chars: {}
        };
        for (let i = 32; i <= 126; i++) {
            mockFont.chars[i] = {
                w: 8, h: 14, ox: 0, oy: 2, adv: 10
            };
        }

        it('returns empty measurements when font or text is missing', () => {
            const res = FontMath.measureText(null, 'Hello', 20);
            expect(res.boundsWidth).toBe(0);
            expect(res.lines).toEqual([]);
        });

        it('measures unwrapped text when width is 0 or unlimited', () => {
            const res = FontMath.measureText(mockFont, 'Hello World', 20, { width: 0, autoLine: true });
            expect(res.lines).toEqual(['Hello World']);
            expect(res.lineWidths[0]).toBe(110);
        });

        it('wraps text automatically across unlimited lines when autoLine is true', () => {
            const res = FontMath.measureText(mockFont, 'One Two Three Four Five', 20, { width: 60, autoLine: true });
            expect(res.lines.length).toBeGreaterThanOrEqual(3);
            expect(res.boundsWidth).toBe(60);
        });

        it('caps wrapped lines at maxLine when autoLine is false', () => {
            const res = FontMath.measureText(mockFont, 'One Two Three Four Five', 20, { width: 60, maxLine: 2, autoLine: false });
            expect(res.lines.length).toBe(2);
            expect(res.lines[0]).toBe('One');
            expect(res.lineWidths[0]).toBeLessThanOrEqual(60);
            expect(res.lineWidths[1]).toBeLessThanOrEqual(60);
        });

        it('stops at the word before exceeding width on the last line when autoLine is false and maxLine is 1', () => {
            const res = FontMath.measureText(mockFont, 'One Two Three Four Five', 20, { width: 60, maxLine: 1, autoLine: false });
            expect(res.lines.length).toBe(1);
            expect(res.lines[0]).toBe('One');
            expect(res.lineWidths[0]).toBeLessThanOrEqual(60);
        });

        it('recalculates height when maxLine increases when autoLine is false', () => {
            const res1 = FontMath.measureText(mockFont, 'One Two Three Four', 20, { width: 60, maxLine: 1, autoLine: false });
            const res2 = FontMath.measureText(mockFont, 'One Two Three Four', 20, { width: 60, maxLine: 2, autoLine: false });
            expect(res1.lines.length).toBe(1);
            expect(res2.lines.length).toBe(2);
            expect(res2.boundsHeight).toBeGreaterThan(res1.boundsHeight);
        });

        it('applies ellipsis on the last allowed line when overflow is ellipsis', () => {
            const res = FontMath.measureText(mockFont, 'Hello World', 20, { width: 60, maxLine: 1, autoLine: false, overflow: 'ellipsis' });
            expect(res.lines.length).toBe(1);
            expect(res.lines[0].endsWith('...')).toBe(true);
            expect(res.lineWidths[0]).toBeLessThanOrEqual(60);
        });
    });
});

