import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useOPFSStore } from '@opfs/opfs.js';

// ============================================================================
// 1. EXTERNAL DEPENDENCY MOCKING (MODULES & UTILS)
// ============================================================================

const mockMarkAsDirty = vi.fn();
vi.mock('@projects/projects.js', () => ({
  useProjectStore: () => ({
    markAsDirty: mockMarkAsDirty
  })
}));

const mockShowPop = vi.fn();
vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({
    showPop: mockShowPop
  })
}));

vi.mock('@utils/projectFormat.js', () => ({
  encodeLupisProject: vi.fn((data) => JSON.stringify(data)),
  decodeLupisProject: vi.fn((data) => JSON.parse(data))
}));

// Mock Browser Object URL
global.URL.revokeObjectURL = vi.fn();
global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-uuid');

// ============================================================================
// 2. BROWSER OPFS STORAGE MOCK HELPERS
// ============================================================================

function createMockFileHandle(fileName, initialContent = '') {
  let content = initialContent;
  return {
    kind: 'file',
    name: fileName,
    getFile: vi.fn(async () => new File([content], fileName, { type: 'text/plain' })),
    createWritable: vi.fn(async () => ({
      write: vi.fn(async (newContent) => {
        content = newContent;
      }),
      close: vi.fn(async () => {})
    }))
  };
}

function createMockDirectoryHandle(dirName, entriesMap = new Map()) {
  return {
    kind: 'directory',
    name: dirName,
    entries: vi.fn(async function* () {
      for (const [key, value] of entriesMap.entries()) {
        yield [key, value];
      }
    }),
    getDirectoryHandle: vi.fn(async (name, options = {}) => {
      if (entriesMap.has(name)) {
        return entriesMap.get(name);
      }
      if (options.create) {
        const newDir = createMockDirectoryHandle(name);
        entriesMap.set(name, newDir);
        return newDir;
      }
      const error = new Error(`Directory ${name} not found`);
      error.name = 'NotFoundError';
      throw error;
    }),
    getFileHandle: vi.fn(async (name, options = {}) => {
      if (entriesMap.has(name)) {
        return entriesMap.get(name);
      }
      if (options.create) {
        const newFile = createMockFileHandle(name);
        entriesMap.set(name, newFile);
        return newFile;
      }
      const error = new Error(`File ${name} not found`);
      error.name = 'NotFoundError';
      throw error;
    }),
    removeEntry: vi.fn(async (name) => {
      if (!entriesMap.has(name)) {
        const error = new Error(`Entry ${name} not found`);
        error.name = 'NotFoundError';
        throw error;
      }
      entriesMap.delete(name);
    })
  };
}

// ============================================================================
// 3. INTEGRATION TEST: OPFS STORE INTERACTION & STORAGE PERSISTENCE
// ============================================================================

describe('Integration Test: OPFS Store with Storage System and Composables', () => {
  let store;
  let mockRootDirectory;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useOPFSStore();
    vi.clearAllMocks();

    mockRootDirectory = createMockDirectoryHandle('root');

    Object.defineProperty(global.navigator, 'storage', {
      value: {
        getDirectory: vi.fn(async () => mockRootDirectory)
      },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // A. Media Management and Memory Cleanup
  // --------------------------------------------------------------------------
  describe('Memory Management and File Preview', () => {
    it('cleans up old Blob URL from memory when opening a new file', () => {
      // Arrange
      const oldUrl = 'blob:http://localhost/old-uuid';
      store.imageUrl = oldUrl;
      const mockFile = { name: 'script.js', kind: 'file' };

      // Act
      store.setActiveFile(mockFile, 'const x = 10;', '');

      // Assert
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(oldUrl);
      expect(store.activeFile.name).toBe('script.js');
      expect(store.fileContent).toBe('const x = 10;');
      expect(store.imageUrl).toBe('');
    });

    it('clears all file references and releases Blob URL when document is closed', () => {
      // Arrange
      const imgUrl = 'blob:http://localhost/active-image';
      store.setActiveFile({ name: 'sprite.png', kind: 'file' }, '', imgUrl);

      // Act
      store.clearActiveFile();

      // Assert
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(imgUrl);
      expect(store.activeFile).toBeNull();
      expect(store.fileContent).toBe('');
      expect(store.imageUrl).toBe('');
    });
  });

  // --------------------------------------------------------------------------
  // B. Storage I/O Operations and Notifications
  // --------------------------------------------------------------------------
  describe('Writing Files to Browser Storage', () => {
    it('writes file data to physical OPFS storage and updates store state', async () => {
      // Arrange
      const fileName = 'player.js';
      const fileContent = 'class Player {}';

      // Act
      store.setSaving(true);
      const rootDir = await global.navigator.storage.getDirectory();
      const fileHandle = await rootDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();

      await writable.write(fileContent);
      await writable.close();

      store.setActiveFile({ name: fileName, kind: 'file' }, fileContent);
      store.setSaving(false);

      // Assert
      expect(rootDir.getFileHandle).toHaveBeenCalledWith(fileName, { create: true });
      expect(store.fileContent).toBe(fileContent);
      expect(store.isSaving).toBe(false);
      expect(store.hasActiveFile).toBe(true);
    });

    it('[Bad Path] displays error alert and stores error message when storage quota is exceeded', async () => {
      // Arrange
      const mockQuotaError = new Error('Browser storage quota exceeded.');
      mockQuotaError.name = 'QuotaExceededError';
      mockRootDirectory.getFileHandle.mockRejectedValue(mockQuotaError);

      // Act
      try {
        store.setSaving(true);
        const rootDir = await global.navigator.storage.getDirectory();
        await rootDir.getFileHandle('large_asset.raw', { create: true });
      } catch (err) {
        store.setError(err.message);
        mockShowPop({
          title: 'Failed to Save',
          message: err.message,
          type: 'error'
        });
      } finally {
        store.setSaving(false);
      }

      // Assert
      expect(store.errorMessage).toBe('Browser storage quota exceeded.');
      expect(store.isSaving).toBe(false);
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Browser storage quota exceeded.'
        })
      );
    });

    it('[Bad Path] throws exception when accessing non-existent file without create option', async () => {
      // Act & Assert
      await expect(
        mockRootDirectory.getFileHandle('non_existent.json', { create: false })
      ).rejects.toThrow('File non_existent.json not found');
    });
  });

  // --------------------------------------------------------------------------
  // C. Nested Folder Handling and Access Interruption
  // --------------------------------------------------------------------------
  describe('Complex Directory Structure Navigation', () => {
    it('creates and accesses files in deeply nested directories', async () => {
      // Arrange
      const pathSegments = ['assets', 'scripts', 'controllers'];
      let currentDir = mockRootDirectory;

      // Act
      for (const segment of pathSegments) {
        currentDir = await currentDir.getDirectoryHandle(segment, { create: true });
      }
      const targetFile = await currentDir.getFileHandle('Controller.js', { create: true });

      // Assert
      expect(mockRootDirectory.getDirectoryHandle).toHaveBeenCalledWith('assets', { create: true });
      expect(targetFile.name).toBe('Controller.js');
    });

    it('[Bad Path] maintains state consistency when closing document interrupts save process', async () => {
      // Arrange
      const fileItem = { name: 'config.json', kind: 'file' };
      store.setActiveFile(fileItem, '{"version": 1}');
      store.setSaving(true);

      // Act - User cancels/closes document while saving
      store.clearActiveFile();
      store.setSaving(false);

      // Assert
      expect(store.activeFile).toBeNull();
      expect(store.fileContent).toBe('');
      expect(store.isSaving).toBe(false);
    });

    it('[Bad Path] throws exception when attempting to open non-existent directory without create option', async () => {
      // Act & Assert
      await expect(
        mockRootDirectory.getDirectoryHandle('invalid_dir', { create: false })
      ).rejects.toThrow('Directory invalid_dir not found');
    });
  });
});