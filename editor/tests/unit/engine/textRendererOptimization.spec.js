import { describe, it, expect, vi } from 'vitest';
import FontMath from '@core/Util/FontMath.js';
import TextRenderer from '@core/Renderer/Entity/TextRenderer.js';
import RenderUtils from '@core/Renderer/Scene/RenderUtils.js';
import { ApplyResizeToEntity } from '@core/Util/ApplyResizeToEntity.js';
import EditorRenderer from '@core/Renderer/Scene/EditorRenderer.js';

describe('TextRenderer & FontMath Performance Optimizations', () => {
    function createMockFont() {
        const font = {
            id: 'mock_font',
            ready: true,
            glTexture: { id: 'tex_font' },
            info: { size: 16, distance: 8 },
            common: { texW: 512, texH: 512, lineHeight: 20, base: 16, stdYMin: 0, stdYMax: 16 },
            chars: {}
        };
        for (let i = 32; i <= 126; i++) {
            font.chars[i] = {
                x: (i - 32) * 8, y: 0, w: 8, h: 12, ox: 0, oy: 2, adv: 8
            };
        }
        return font;
    }

    function createMockGL() {
        return {
            VERTEX_SHADER: 35633,
            FRAGMENT_SHADER: 35632,
            ARRAY_BUFFER: 34962,
            DYNAMIC_DRAW: 35048,
            FLOAT: 5126,
            TRIANGLES: 4,
            COMPILE_STATUS: 35713,
            createShader: vi.fn(() => ({})),
            shaderSource: vi.fn(),
            compileShader: vi.fn(),
            getShaderParameter: vi.fn(() => true),
            getShaderInfoLog: vi.fn(() => ''),
            createProgram: vi.fn(() => ({})),
            attachShader: vi.fn(),
            bindAttribLocation: vi.fn(),
            linkProgram: vi.fn(),
            getUniformLocation: vi.fn((_, name) => name),
            createBuffer: vi.fn(() => ({})),
            bindBuffer: vi.fn(),
            bufferData: vi.fn(),
            bufferSubData: vi.fn(),
            enableVertexAttribArray: vi.fn(),
            vertexAttribPointer: vi.fn(),
            drawArrays: vi.fn(),
            uniformMatrix4fv: vi.fn(),
            uniform2f: vi.fn(),
            uniform1f: vi.fn(),
            uniform4fv: vi.fn(),
            getExtension: vi.fn()
        };
    }

    function createTextRenderer(gl = createMockGL()) {
        const ctx = { gl, createVAO: vi.fn(() => ({})) };
        const cache = { bindVAO: vi.fn(), useProgram: vi.fn(), bindTexture: vi.fn() };
        return { renderer: new TextRenderer(ctx, cache), gl, ctx, cache };
    }

    describe('FontMath Measurement Memoization / Caching', () => {
        it('caches measurement and returns identical reference on repeated calls', () => {
            const font = createMockFont();
            const res1 = FontMath.measureText(font, 'Test Text', 16, { width: 100 });
            const res2 = FontMath.measureText(font, 'Test Text', 16, { width: 100 });

            // Must be exact same object reference (0 ms re-computation)
            expect(res1).toBe(res2);
            expect(res1.lines).toEqual(['Test Text']);
        });

        it('re-computes when options or text string change', () => {
            const font = createMockFont();
            const res1 = FontMath.measureText(font, 'Hello', 16, { width: 100 });
            const res2 = FontMath.measureText(font, 'World', 16, { width: 100 });
            const res3 = FontMath.measureText(font, 'Hello', 24, { width: 100 });
            const res4 = FontMath.measureText(font, 'Hello', 16, { width: 50 });

            expect(res1).not.toBe(res2);
            expect(res1).not.toBe(res3);
            expect(res1).not.toBe(res4);
        });

        it('allows clearing cache via clearCache()', () => {
            const font = createMockFont();
            const res1 = FontMath.measureText(font, 'Cached', 16);
            FontMath.clearCache(font);
            const res2 = FontMath.measureText(font, 'Cached', 16);

            expect(res1).not.toBe(res2);
            expect(res1.lines).toEqual(res2.lines);
        });
    });

    describe('RenderUtils to TextRenderer Measurement Pass-Through', () => {
        it('passes pre-calculated measurement through RenderUtils.processText to eliminate double measurement', () => {
            const font = createMockFont();
            const world = { assets: { fonts: { mock_font: font } } };
            const renderQueue = [];
            const comps = {
                TextRenderer: {
                    assetId: 'mock_font',
                    value: 'Score: 100',
                    fontSize: 16,
                    color: '#ffffff'
                }
            };
            const rawT = { x: 0, y: 0, width: 200, height: 20 };
            const trans = { ...rawT };

            RenderUtils.processText(comps, 1.0, false, false, rawT, world, renderQueue, trans);

            expect(renderQueue.length).toBe(1);
            const queuedItem = renderQueue[0];
            expect(queuedItem.type).toBe('text');
            // Measurement must be pre-calculated and cached on textOptions
            expect(queuedItem.textOptions.measurement).toBeDefined();
            expect(queuedItem.textOptions.measurement.lines).toEqual(['Score: 100']);

            // Spying on FontMath.measureText: TextRenderer.drawText should not need to measure again
            const spyMeasure = vi.spyOn(FontMath, 'measureText');
            const { renderer } = createTextRenderer();
            const proj = new Float32Array(16);

            const opt = queuedItem.textOptions;
            const t = queuedItem.transformData;
            renderer.drawText(
                opt.font, opt.text, t.x, t.y, t.width, t.height,
                opt.fontSize, opt.color, proj, t.rotation, t.scaleX, t.scaleY,
                t.pivotX, t.pivotY, opt.opacity, opt.flipX, opt.flipY, opt
            );

            expect(spyMeasure).not.toHaveBeenCalled();
            spyMeasure.mockRestore();
        });
    });

    describe('Zero-Allocation Glyph Stream Writing in TextRenderer', () => {
        it('writes glyph vertices directly to bufferData with correct coordinates and quad layout', () => {
            const { renderer } = createTextRenderer();
            const font = createMockFont();
            const proj = new Float32Array(16);

            // 'AB' has 2 characters -> 2 glyphs * 6 vertices = 12 vertices * 8 floats = 96 floats
            renderer.drawText(font, 'AB', 10, 20, 100, 20, 16, [1, 0, 0, 1], proj);

            expect(renderer.bufferIndex).toBe(96);

            // Check first vertex of character 'A' (y = 20 + gdat.oy(2) = 22)
            expect(renderer.bufferData[0]).toBeCloseTo(10); // x
            expect(renderer.bufferData[1]).toBeCloseTo(22); // y
            // Color RGBA
            expect(renderer.bufferData[4]).toBeCloseTo(1);  // R
            expect(renderer.bufferData[5]).toBeCloseTo(0);  // G
            expect(renderer.bufferData[6]).toBeCloseTo(0);  // B
            expect(renderer.bufferData[7]).toBeCloseTo(1);  // A
        });

        it('supports shadows without crashing and flushes buffer cleanly', () => {
            const { renderer, gl } = createTextRenderer();
            const font = createMockFont();
            const proj = new Float32Array(16);

            renderer.drawText(font, 'Shadowed', 0, 0, 200, 20, 16, [1, 1, 1, 1], proj, 0, 1, 1, 0, 0, 1, false, false, {
                shadowEnabled: true,
                shadowColor: [0, 0, 0, 1],
                shadowOffset: { x: 2, y: 2 }
            });

            // Shadow pass was flushed, main text is in buffer or flushed
            expect(gl.drawArrays).toHaveBeenCalled();
        });
    });

    describe('TextRenderer Scale Transform Support', () => {
        it('preserves scaleX and scaleY in Transform and UITransform when ApplyResizeToEntity is executed', () => {
            const font = createMockFont();
            const world = { assets: { fonts: { system_default: font } } };

            const entityTransform = {
                components: {
                    Transform: { width: 100, height: 20, scaleX: 2.5, scaleY: 3.0 },
                    TextRenderer: { value: 'Scaled Text', fontSize: 16 }
                }
            };
            ApplyResizeToEntity(entityTransform, world, true);
            expect(entityTransform.components.Transform.scaleX).toBe(2.5);
            expect(entityTransform.components.Transform.scaleY).toBe(3.0);

            const entityUITransform = {
                components: {
                    UITransform: { width: 120, height: 30, scaleX: 0.8, scaleY: 1.5 },
                    TextRenderer: { value: 'UI Scaled Text', fontSize: 16 }
                }
            };
            ApplyResizeToEntity(entityUITransform, world, true);
            expect(entityUITransform.components.UITransform.scaleX).toBe(0.8);
            expect(entityUITransform.components.UITransform.scaleY).toBe(1.5);
        });

        it('scales glyph vertex positions and dimensions in TextRenderer with scaleX and scaleY', () => {
            const { renderer } = createTextRenderer();
            const font = createMockFont();
            const proj = new Float32Array(16);

            // 'A' with size 16, width 100, height 20, scale sx=2, sy=3, pivot px=0, py=0 at (50, 50)
            // In createMockFont: char 65 has ox=0, oy=2, w=8, h=12, adv=8.
            renderer.drawText(font, 'A', 50, 50, 100, 20, 16, [1, 1, 1, 1], proj, 0, 2, 3, 0, 0);

            // First vertex (TL):
            // x0 = 0 -> fx0 = 0 * 2 = 0 -> tlX = 50 + 0 = 50
            // y0 = 2 -> fy0 = 2 * 3 = 6 -> tlY = 50 + 6 = 56
            expect(renderer.bufferData[0]).toBeCloseTo(50);
            expect(renderer.bufferData[1]).toBeCloseTo(56);

            // Second vertex (TR):
            // x1 = x0 + w(8) = 8 -> fx1 = 8 * 2 = 16 -> trX = 50 + 16 = 66
            // trY = tlY = 56
            expect(renderer.bufferData[8]).toBeCloseTo(66);
            expect(renderer.bufferData[9]).toBeCloseTo(56);

            // Third vertex (BL):
            // y1 = y0 + h(12) = 14 -> fy1 = 14 * 3 = 42 -> blY = 50 + 42 = 92
            // blX = tlX = 50
            expect(renderer.bufferData[16]).toBeCloseTo(50);
            expect(renderer.bufferData[17]).toBeCloseTo(92);
        });

        it('properly scales around pivot point (px=0.5, py=0.5)', () => {
            const { renderer } = createTextRenderer();
            const font = createMockFont();
            const proj = new Float32Array(16);

            // At (100, 100) with w=100, h=20, sx=2, sy=2, px=0.5, py=0.5
            // targetW = 100, targetH = 20
            // pivotOffsetX = -0.5 * 100 * 2 = -100
            // pivotOffsetY = -0.5 * 20 * 2 = -20
            // For char 'A': x0 = 0, y0 = 2, w = 8, h = 12
            // fx0 = 0 * 2 - 100 = -100 -> tlX = 100 - 100 = 0
            // fy0 = 2 * 2 - 20 = -16 -> tlY = 100 - 16 = 84
            renderer.drawText(font, 'A', 100, 100, 100, 20, 16, [1, 1, 1, 1], proj, 0, 2, 2, 0.5, 0.5);

            expect(renderer.bufferData[0]).toBeCloseTo(0);
            expect(renderer.bufferData[1]).toBeCloseTo(84);
        });

        it('EditorRenderer passes textOptions.scaleX and scaleY to TextRenderer', () => {
            const drawTextSpy = vi.fn();
            const mockText = { drawText: drawTextSpy };
            const proj = new Float32Array(16);
            const mockFont = createMockFont();

            const editorRenderer = new EditorRenderer(null, null, mockText, {});
            editorRenderer.setProjection(proj);
            editorRenderer.drawText('Test', 10, 20, 16, '#ffffff', mockFont, 0, { scaleX: 2.5, scaleY: 3.5 });

            expect(drawTextSpy).toHaveBeenCalledWith(
                mockFont,
                'Test',
                10, 20,
                0, 0,
                16,
                '#ffffff',
                proj,
                0,
                2.5, 3.5, // scaleX, scaleY
                0, 0,
                1,
                false, false,
                expect.any(Object)
            );
        });
    });
});
