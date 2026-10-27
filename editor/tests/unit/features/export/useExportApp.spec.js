import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useExportApp } from '@/composables/useExportApp.js';
import * as webExporter from '@/features/export/webExporter.js';

vi.mock('@/features/export/webExporter.js', () => ({
  buildClientWebPackage: vi.fn().mockResolvedValue(new Blob(['dummy_zip_content'], { type: 'application/zip' }))
}));

describe('useExportApp Composable (Client-Side ZIP Export)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Mock global document.createElement for download simulation
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/dummy');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('exports standalone Web ZIP directly on client-side without calling backend service', async () => {
    // Mock navigator.storage.getDirectory
    const mockProjectDir = {
      getFileHandle: vi.fn().mockResolvedValue({
        getFile: async () => ({
          text: async () => JSON.stringify({ name: 'My Client Game', updatedAt: '2026-10-27T00:00:00.000Z' })
        })
      })
    };

    const mockProjectsDir = {
      getDirectoryHandle: vi.fn().mockResolvedValue(mockProjectDir)
    };

    const mockAppDir = {
      getDirectoryHandle: vi.fn().mockResolvedValue(mockProjectsDir)
    };

    globalThis.navigator.storage = {
      getDirectory: vi.fn().mockResolvedValue({
        getDirectoryHandle: vi.fn().mockResolvedValue(mockAppDir)
      })
    };

    // Track simulated fetch to ensure no backend URL is contacted for ZIP
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('fetch should not be called for client-side ZIP export');
    });

    const { exportApp } = useExportApp();
    const result = await exportApp('proj_client_999', 'zip', 'release');

    expect(result.success).toBe(true);
    expect(result.mode).toBe('release');
    expect(webExporter.buildClientWebPackage).toHaveBeenCalledWith(
      expect.objectContaining({
        projectDirHandle: mockProjectDir,
        mode: 'release',
        projectName: 'My_Client_Game'
      })
    );

    // Backend fetch was never triggered
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
