import { describe, it, expect, vi } from 'vitest';
import TilemapRenderer from '@core/Renderer/Scene/TilemapRenderer.js';

describe('TilemapRenderer Performance Optimizations', () => {
    function createMockGame(camX = 0, camY = 0, camScale = 1, canvasW = 800, canvasH = 600) {
        return {
            camera: { x: camX, y: camY, scale: camScale },
            renderer: { canvas: { width: canvasW, height: canvasH } },
            world: {}
        };
    }

    function createMockImage() {
        return {
            drawQuad: vi.fn(),
            flush: vi.fn()
        };
    }

    function createMockShape() {
        return {
            drawLine: vi.fn(),
            drawParametricShape: vi.fn(),
            flush: vi.fn()
        };
    }

    it('culls tiles that are outside the camera viewport (Frustum Culling)', () => {
        const image = createMockImage();
        const shape = createMockShape();
        const game = createMockGame(0, 0, 1, 800, 600); // Viewport spans -400 to +400 X, -300 to +300 Y
        const renderer = new TilemapRenderer(image, shape, game);

        const entity = {
            id: 'tm_1',
            components: {
                Transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                Tilemap: {
                    width: 32,
                    height: 32,
                    assetId: 'tex_1',
                    data: {
                        '0,0': 1,       // Inside (0, 0)
                        '5,5': 1,       // Inside (160, 160)
                        '100,100': 1,   // Far Outside (3200, 3200)
                        '-200,-200': 1  // Far Outside (-6400, -6400)
                    }
                }
            }
        };

        const world = {
            assets: {
                textures: {
                    tex_1: { width: 256, height: 256 }
                }
            }
        };

        const proj = new Float32Array(16);
        renderer.renderEntity(entity, world, proj);

        // Only the 2 tiles inside the viewport should be drawn
        expect(image.drawQuad).toHaveBeenCalledTimes(2);
        expect(image.flush).toHaveBeenCalledTimes(1);
    });

    it('skips all drawQuad calls when the entire tilemap is off-screen', () => {
        const image = createMockImage();
        const shape = createMockShape();
        // Camera at (0, 0), viewport width 800, height 600
        const game = createMockGame(0, 0, 1, 800, 600);
        const renderer = new TilemapRenderer(image, shape, game);

        const entity = {
            id: 'tm_far',
            components: {
                Transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                Tilemap: {
                    width: 32,
                    height: 32,
                    assetId: 'tex_1',
                    data: {
                        '500,500': 1,
                        '501,500': 1
                    }
                }
            }
        };

        const world = {
            assets: {
                textures: {
                    tex_1: { width: 256, height: 256 }
                }
            }
        };

        const proj = new Float32Array(16);
        renderer.renderEntity(entity, world, proj);

        // Zero draw calls because the entire tilemap is off-screen
        expect(image.drawQuad).not.toHaveBeenCalled();
    });

    it('uses reusable objects in drawQuad calls without creating new objects per tile', () => {
        const image = createMockImage();
        const shape = createMockShape();
        const game = createMockGame(0, 0, 1, 800, 600);
        const renderer = new TilemapRenderer(image, shape, game);

        const entity = {
            id: 'tm_reuse',
            components: {
                Transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                Tilemap: {
                    width: 32,
                    height: 32,
                    assetId: 'tex_1',
                    data: {
                        '0,0': 1,
                        '1,0': 2
                    }
                }
            }
        };

        const world = {
            assets: {
                textures: {
                    tex_1: { width: 256, height: 256 }
                }
            }
        };

        const proj = new Float32Array(16);
        renderer.renderEntity(entity, world, proj);

        expect(image.drawQuad).toHaveBeenCalledTimes(2);
        // Both calls receive the reusable vertex structure
        const firstCallVertices = image.drawQuad.mock.calls[0][2];
        const secondCallVertices = image.drawQuad.mock.calls[1][2];
        expect(firstCallVertices).toBe(renderer._reusableVertices);
        expect(secondCallVertices).toBe(renderer._reusableVertices);
    });

    it('clamps and skips grid lines when zooming out to prevent line explosion', () => {
        const image = createMockImage();
        const shape = createMockShape();
        // Zoom way out: scale 0.05 (1 tile is only 1.6 screen pixels)
        const game = createMockGame(0, 0, 0.05, 1920, 1080);
        const renderer = new TilemapRenderer(image, shape, game);

        const entity = {
            id: 'tm_zoom',
            components: {
                Transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                Tilemap: {
                    width: 32,
                    height: 32,
                    assetId: 'tex_1',
                    data: { '0,0': 1 }
                }
            }
        };

        const world = {
            _editors: {
                activeTabId: 'tm_zoom',
                tilemapContext: { showGrid: true }
            },
            assets: {
                textures: {
                    tex_1: { width: 256, height: 256 }
                }
            }
        };

        const proj = new Float32Array(16);
        renderer.renderEntity(entity, world, proj);

        // At scale 0.05, 32px tile is 1.6px on screen (< 5px threshold) -> grid drawing is safely skipped
        expect(shape.drawLine).not.toHaveBeenCalled();
    });

    it('calculates unrotated tile quad vertices using fast-path additions without trigonometric multiplications', () => {
        const image = createMockImage();
        const shape = createMockShape();
        const game = createMockGame(0, 0, 1, 800, 600);
        const renderer = new TilemapRenderer(image, shape, game);

        const rData = {
            tfX: 100,
            tfY: 200,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            tileW: 32,
            tileH: 32
        };

        const v = renderer._setTileQuadVertices(rData, 32, 32, 1, 0, 2, 3);
        // gx=2 => local x=64, tfX=100 => tl.x=164, tr.x=196
        // gy=3 => local y=96, tfY=200 => tl.y=296, bl.y=328
        expect(v.tl.x).toBe(164);
        expect(v.tl.y).toBe(296);
        expect(v.tr.x).toBe(196);
        expect(v.tr.y).toBe(296);
        expect(v.bl.x).toBe(164);
        expect(v.bl.y).toBe(328);
        expect(v.br.x).toBe(196);
        expect(v.br.y).toBe(328);
    });
});
