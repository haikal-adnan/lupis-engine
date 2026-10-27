import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generateMsdfBmFont } from '@assets/composables/msdfGenerator.js';

describe('Unit Test: msdfGenerator Service', () => {
  it('generates valid BMFont XML and PNG buffers from sample TTF font buffer', async () => {
    const fontPath = path.resolve(process.cwd(), '../tests/test-data/assets/sample_font.ttf');
    const fontBuffer = fs.readFileSync(fontPath);

    // Pass a focused set of character codes (including space) for fast unit test execution
    const testCharset = [32, 0xf000, 0xf001, 0xf002];

    const result = await generateMsdfBmFont(fontBuffer, {
      faceName: 'SampleFont',
      fileName: 'SampleFont',
      fontSize: 32,
      distanceRange: 8,
      texturePadding: 8,
      textureSize: 512,
      charset: testCharset
    });

    expect(result).toBeDefined();
    expect(typeof result.fntContent).toBe('string');
    expect(result.pngBuffers).toBeInstanceOf(Array);
    expect(result.pngBuffers.length).toBeGreaterThan(0);

    // Verify XML structure
    const xml = result.fntContent;
    expect(xml).toContain('<?xml version="1.0"?>');
    expect(xml).toContain('<font>');
    expect(xml).toContain('<info face="SampleFont" size="32"');
    expect(xml).toContain('<common lineHeight=');
    expect(xml).toContain('base=');
    expect(xml).toContain('<distanceField fieldType="msdf" distanceRange="8"/>');
    expect(xml).toContain('<chars count=');
    expect(xml).toContain('<char id="32"'); // Space character
    expect(xml).toContain('<char id="61440"'); // 0xf000

    // Verify PNG header (89 50 4E 47 0D 0A 1A 0A)
    const pngBuf = result.pngBuffers[0];
    expect(pngBuf).toBeInstanceOf(Uint8Array);
    expect(pngBuf[0]).toBe(0x89);
    expect(pngBuf[1]).toBe(0x50); // P
    expect(pngBuf[2]).toBe(0x4e); // N
    expect(pngBuf[3]).toBe(0x47); // G
  }, 15000);
});
