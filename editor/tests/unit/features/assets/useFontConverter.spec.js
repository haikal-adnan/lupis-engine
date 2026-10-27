import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useFontConverter } from '@assets/composables/useFontConverter.js';
import * as msdfGeneratorModule from '@assets/composables/msdfGenerator.js';
import { usePopAlert } from '@composables/composables.js';

vi.mock('@composables/composables.js', () => ({
  usePopAlert: vi.fn(),
}));

describe('Unit Test: useFontConverter Composable (Client-side MSDF)', () => {
  let mockShowPop;

  beforeEach(() => {
    setActivePinia(createPinia());

    mockShowPop = vi.fn();
    vi.mocked(usePopAlert).mockReturnValue({ showPop: mockShowPop });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('returns null immediately when fontFile is null or undefined', async () => {
    const { convertTtfToBmFont, isConverting } = useFontConverter();

    const result = await convertTtfToBmFont(null);

    expect(result).toBeNull();
    expect(isConverting.value).toBe(false);
  });

  it('converts font successfully using client-side generator and creates fnt and png Files', async () => {
    const mockFnt = '<?xml version="1.0"?>\n<font><info face="MyCustomFont" size="32"/></font>';
    const mockPngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

    const generateSpy = vi.spyOn(msdfGeneratorModule, 'generateMsdfBmFont').mockResolvedValueOnce({
      fntContent: mockFnt,
      pngBuffers: [mockPngBytes]
    });

    const { convertTtfToBmFont, isConverting } = useFontConverter();
    const mockFile = new File(['mock-ttf-data'], 'MyCustomFont.ttf', { type: 'font/ttf' });

    const result = await convertTtfToBmFont(mockFile);

    expect(generateSpy).toHaveBeenCalledWith(
      expect.any(ArrayBuffer),
      expect.objectContaining({
        faceName: 'MyCustomFont',
        fileName: 'MyCustomFont',
        fontSize: 32,
        distanceRange: 8,
        texturePadding: 8,
        textureSize: 2048
      })
    );

    expect(result).not.toBeNull();
    expect(result.originalFont).toBe(mockFile);
    expect(result.fntFile.name).toBe('MyCustomFont.fnt');
    expect(result.pngFiles).toHaveLength(1);
    expect(result.pngFiles[0].name).toBe('MyCustomFont.png');
    expect(isConverting.value).toBe(false);
  });

  it('handles multi-page font atlas output and names png files with indices', async () => {
    const mockFnt = '<?xml version="1.0"?>\n<font><info face="BigFont" size="32"/></font>';
    const page0 = new Uint8Array([137, 80, 78, 71]);
    const page1 = new Uint8Array([137, 80, 78, 71]);

    vi.spyOn(msdfGeneratorModule, 'generateMsdfBmFont').mockResolvedValueOnce({
      fntContent: mockFnt,
      pngBuffers: [page0, page1]
    });

    const { convertTtfToBmFont, isConverting } = useFontConverter();
    const mockFile = new File(['font-data'], 'BigFont.ttf', { type: 'font/ttf' });

    const result = await convertTtfToBmFont(mockFile);

    expect(result).not.toBeNull();
    expect(result.fntFile.name).toBe('BigFont.fnt');
    expect(result.pngFiles).toHaveLength(2);
    expect(result.pngFiles[0].name).toBe('BigFont_0.png');
    expect(result.pngFiles[1].name).toBe('BigFont_1.png');
    expect(isConverting.value).toBe(false);
  });

  it('handles generator failure gracefully and shows error pop-up', async () => {
    vi.spyOn(msdfGeneratorModule, 'generateMsdfBmFont').mockRejectedValueOnce(
      new Error('Invalid font outline format')
    );

    const { convertTtfToBmFont, isConverting } = useFontConverter();
    const mockFile = new File(['corrupted-bytes'], 'Corrupted.ttf', { type: 'font/ttf' });

    const result = await convertTtfToBmFont(mockFile);

    expect(result).toBeNull();
    expect(isConverting.value).toBe(false);
    expect(mockShowPop).toHaveBeenCalledWith({
      title: 'Font Conversion Failed',
      message: 'Invalid font outline format',
      type: 'error',
    });
  });
});
