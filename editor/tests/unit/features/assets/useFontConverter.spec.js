import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import JSZip from 'jszip';
import { useFontConverter } from '@assets/composables/useFontConverter.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { usePopAlert } from '@composables/composables.js';

vi.mock('@composables/composables.js', () => ({
  usePopAlert: vi.fn(),
}));

describe('Unit Test: useFontConverter Composable', () => {
  let workspaceStore;
  let mockShowPop;

  beforeEach(() => {
    setActivePinia(createPinia());
    workspaceStore = useWorkspaceStore();
    workspaceStore.config.backendUrl = 'http://localhost:37602';

    mockShowPop = vi.fn();
    vi.mocked(usePopAlert).mockReturnValue({ showPop: mockShowPop });

    global.fetch = vi.fn();
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
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('converts font successfully with 20s timeout signal and extracts fnt and png from zip', async () => {
    const zip = new JSZip();
    zip.file('font.fnt', 'info face="CustomFont"...');
    zip.file('font.png', new Uint8Array([137, 80, 78, 71]));
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(zipBuffer),
    });

    const { convertTtfToBmFont, isConverting } = useFontConverter();
    const mockFile = new File(['mock-ttf'], 'MyCustomFont.ttf', { type: 'font/ttf' });

    const result = await convertTtfToBmFont(mockFile);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:37602/api/convert-font',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
        signal: expect.any(AbortSignal),
      })
    );

    expect(result).not.toBeNull();
    expect(result.originalFont).toBe(mockFile);
    expect(result.fntFile.name).toBe('MyCustomFont.fnt');
    expect(result.pngFiles).toHaveLength(1);
    expect(result.pngFiles[0].name).toBe('MyCustomFont.png');
    expect(isConverting.value).toBe(false);
  });

  it('handles timeout (AbortError / TimeoutError) gracefully with a 20-second timeout message', async () => {
    const timeoutErr = new Error('The operation was aborted due to timeout');
    timeoutErr.name = 'TimeoutError';
    global.fetch.mockRejectedValueOnce(timeoutErr);

    const { convertTtfToBmFont, isConverting } = useFontConverter();
    const mockFile = new File(['large-font'], 'LargeFont.ttf', { type: 'font/ttf' });

    const result = await convertTtfToBmFont(mockFile);

    expect(result).toBeNull();
    expect(isConverting.value).toBe(false);
    expect(mockShowPop).toHaveBeenCalledWith({
      title: 'Font Conversion Failed',
      message: 'Font conversion timed out (20 seconds).',
      type: 'error',
    });
  });

  it('handles server HTTP error response and shows server message', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 504,
      json: () => Promise.resolve({ error: 'Font conversion timed out (20 seconds).' }),
    });

    const { convertTtfToBmFont, isConverting } = useFontConverter();
    const mockFile = new File(['font'], 'Custom.ttf', { type: 'font/ttf' });

    const result = await convertTtfToBmFont(mockFile);

    expect(result).toBeNull();
    expect(isConverting.value).toBe(false);
    expect(mockShowPop).toHaveBeenCalledWith({
      title: 'Font Conversion Failed',
      message: 'Font conversion timed out (20 seconds).',
      type: 'error',
    });
  });

  it('handles incomplete zip archive missing fnt or png', async () => {
    const zip = new JSZip();
    zip.file('something_else.txt', 'hello');
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(zipBuffer),
    });

    const { convertTtfToBmFont, isConverting } = useFontConverter();
    const mockFile = new File(['font'], 'Corrupted.ttf', { type: 'font/ttf' });

    const result = await convertTtfToBmFont(mockFile);

    expect(result).toBeNull();
    expect(isConverting.value).toBe(false);
    expect(mockShowPop).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Font Conversion Failed',
        message: expect.stringContaining('Incomplete ZIP extraction results'),
        type: 'error',
      })
    );
  });
});
