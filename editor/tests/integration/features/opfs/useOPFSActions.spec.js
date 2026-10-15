import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useOPFSStore, useOPFSActions, opfsItemSchema, getFileTypeByExtension } from '@opfs/opfs.js';
import { useProjectStore } from '@projects/projects.js';
import { usePopAlert } from '@composables/composables.js';
import { encodeLupisProject, decodeLupisProject } from '@utils/projectFormat.js';

// ==============================================================================
// 1. EXTERNAL DEPENDENCY MOCKING
// ==============================================================================
vi.mock('@projects/projects.js', () => ({
  useProjectStore: vi.fn(),
}));

vi.mock('@composables/composables.js', () => ({
  usePopAlert: vi.fn(),
}));

vi.mock('@utils/projectFormat.js', () => ({
  encodeLupisProject: vi.fn(),
  decodeLupisProject: vi.fn(),
}));

// Helper Mock FileHandle OPFS
const createMockFileHandle = (fileName, content = 'sample content') => {
  const mockFile = new File([content], fileName, { type: 'text/plain' });
  return {
    kind: 'file',
    name: fileName,
    getFile: vi.fn().mockResolvedValue({
      ...mockFile,
      name: fileName,
      text: vi.fn().mockResolvedValue(content),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    }),
    createWritable: vi.fn().mockResolvedValue({
      write: vi.fn().mockResolvedValue(true),
      close: vi.fn().mockResolvedValue(true),
    }),
  };
};

// Helper Mock DirectoryHandle OPFS
const createMockDirectoryHandle = (dirName, entriesMap = new Map()) => {
  return {
    kind: 'directory',
    name: dirName,
    entries: vi.fn().mockImplementation(() => {
      const entriesArray = Array.from(entriesMap.entries());
      return (async function* () {
        for (const [key, value] of entriesArray) {
          yield [key, value];
        }
      })();
    }),
    getDirectoryHandle: vi.fn(),
    getFileHandle: vi.fn(),
    removeEntry: vi.fn().mockResolvedValue(true),
  };
};

// ==============================================================================
// 2. INTEGRATION TEST: USE OPFS ACTIONS
// ==============================================================================
describe('Integration Test: useOPFSActions with Pinia Store, UI Alert, and Storage', () => {
  let opfsStore;
  let mockProjectStore;
  let mockShowPop;

  beforeEach(() => {
    setActivePinia(createPinia());
    opfsStore = useOPFSStore();

    mockProjectStore = {
      markAsDirty: vi.fn(),
    };
    vi.mocked(useProjectStore).mockReturnValue(mockProjectStore);

    mockShowPop = vi.fn();
    vi.mocked(usePopAlert).mockReturnValue({ showPop: mockShowPop });

    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-url');
    global.URL.revokeObjectURL = vi.fn();

    Object.defineProperty(global.navigator, 'storage', {
      value: {
        getDirectory: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  // ----------------------------------------------------------------------------
  // A. Browser OPFS API Support & Base Helpers
  // ----------------------------------------------------------------------------
  describe('Browser OPFS API Support & Core Executors', () => {
    it('[Bad Path] throws Error when executed in a browser without OPFS API support', async () => {
      delete global.navigator.storage;
      const { getUserDirectory } = useOPFSActions();

      await expect(getUserDirectory()).rejects.toThrow();
    });

    it('returns root directory handle when browser supports OPFS', async () => {
      const mockRoot = createMockDirectoryHandle('root');
      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);
      const { getUserDirectory } = useOPFSActions();

      const result = await getUserDirectory();

      expect(result).toBe(mockRoot);
    });

    it('getProjectsRootDirectory returns lupis-engine/projects handle', async () => {
      const mockProjectsDir = createMockDirectoryHandle('projects');
      const mockEngineDir = createMockDirectoryHandle('lupis-engine');
      mockEngineDir.getDirectoryHandle.mockResolvedValue(mockProjectsDir);

      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getDirectoryHandle.mockResolvedValue(mockEngineDir);

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const { getProjectsRootDirectory } = useOPFSActions();
      const result = await getProjectsRootDirectory();

      expect(mockRoot.getDirectoryHandle).toHaveBeenCalledWith('lupis-engine', { create: true });
      expect(mockEngineDir.getDirectoryHandle).toHaveBeenCalledWith('projects', { create: true });
      expect(result).toBe(mockProjectsDir);
    });

    it('resolveDirectoryPath navigates subfolders based on string or array path', async () => {
      const mockAssetsDir = createMockDirectoryHandle('assets');
      const mockProjDir = createMockDirectoryHandle('proj-123');
      mockProjDir.getDirectoryHandle.mockResolvedValue(mockAssetsDir);

      const mockRoot = createMockDirectoryHandle('projects');
      mockRoot.getDirectoryHandle.mockResolvedValue(mockProjDir);

      const { resolveDirectoryPath } = useOPFSActions();
      const result = await resolveDirectoryPath(mockRoot, 'proj-123/assets');

      expect(mockRoot.getDirectoryHandle).toHaveBeenCalledWith('proj-123', { create: true });
      expect(mockProjDir.getDirectoryHandle).toHaveBeenCalledWith('assets', { create: true });
      expect(result).toBe(mockAssetsDir);
    });

    it('writeFileToHandle writes data to specific file handle', async () => {
      const mockWritable = { write: vi.fn(), close: vi.fn() };
      const mockFileHandle = { createWritable: vi.fn().mockResolvedValue(mockWritable) };
      const mockDir = createMockDirectoryHandle('assets');
      mockDir.getFileHandle.mockResolvedValue(mockFileHandle);

      const { writeFileToHandle } = useOPFSActions();
      await writeFileToHandle(mockDir, 'test.png', 'binary-data');

      expect(mockDir.getFileHandle).toHaveBeenCalledWith('test.png', { create: true });
      expect(mockWritable.write).toHaveBeenCalledWith('binary-data');
      expect(mockWritable.close).toHaveBeenCalled();
    });

    it('getFileBlobUrlFromHandle reads file and returns Blob URL', async () => {
      const mockFileHandle = createMockFileHandle('image.png', 'content');
      const mockDir = createMockDirectoryHandle('assets');
      mockDir.getFileHandle.mockResolvedValue(mockFileHandle);

      const { getFileBlobUrlFromHandle } = useOPFSActions();
      const url = await getFileBlobUrlFromHandle(mockDir, 'image.png');

      expect(mockDir.getFileHandle).toHaveBeenCalledWith('image.png');
      expect(url).toBe('blob:http://localhost/mock-url');
    });
  });

  // ----------------------------------------------------------------------------
  // B. Directory & File Structure Scan
  // ----------------------------------------------------------------------------
  describe('Folder Structure Scan (refreshTree)', () => {
    it('scans OPFS directory recursively and updates fileTree in store', async () => {
      const fileHandle = createMockFileHandle('app.js');
      const subDirHandle = createMockDirectoryHandle('assets', new Map());

      const mockRoot = createMockDirectoryHandle(
        'root',
        new Map([
          ['assets', subDirHandle],
          ['app.js', fileHandle],
        ])
      );

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);
      const { refreshTree } = useOPFSActions();

      await refreshTree();

      expect(opfsStore.fileTree).toHaveLength(2);
      expect(opfsStore.fileTree[0].name).toBe('assets');
      expect(opfsStore.fileTree[0].kind).toBe('directory');
      expect(opfsStore.fileTree[1].name).toBe('app.js');
      expect(opfsStore.fileTree[1].kind).toBe('file');
      expect(opfsStore.isLoading).toBe(false);
    });

    it('[Bad Path] handles directory access failure by recording error message in store', async () => {
      global.navigator.storage.getDirectory.mockRejectedValue(new Error('Access denied'));
      const { refreshTree } = useOPFSActions();

      await refreshTree();

      expect(opfsStore.errorMessage).toBe('Access denied');
      expect(opfsStore.isLoading).toBe(false);
    });
  });

  // ----------------------------------------------------------------------------
  // C. File Open Operations
  // ----------------------------------------------------------------------------
  describe('File Reading (openFile)', () => {
    it('reads text code file and updates activeFile and fileContent state', async () => {
      const fileHandle = createMockFileHandle('script.js', 'console.log("test");');
      const fileItem = opfsItemSchema({ name: 'script.js', kind: 'file', path: 'script.js', handle: fileHandle });
      const { openFile } = useOPFSActions();

      await openFile(fileItem);

      expect(opfsStore.activeFile).toMatchObject({
        name: 'script.js',
        kind: 'file',
        path: 'script.js',
      });
      expect(opfsStore.fileContent).toBe('console.log("test");');
      expect(opfsStore.imageUrl).toBe('');
      expect(opfsStore.isLoading).toBe(false);
    });

    it('creates Blob Object URL when opening image file', async () => {
      const fileHandle = createMockFileHandle('logo.png');
      const fileItem = opfsItemSchema({ name: 'logo.png', kind: 'file', path: 'logo.png', handle: fileHandle });
      const { openFile } = useOPFSActions();

      await openFile(fileItem);

      expect(opfsStore.activeFile).toMatchObject({
        name: 'logo.png',
        kind: 'file',
        path: 'logo.png',
      });
      expect(opfsStore.fileContent).toBe('');
      expect(opfsStore.imageUrl).toBe('blob:http://localhost/mock-url');
      expect(opfsStore.isLoading).toBe(false);
    });

    it('[Bad Path] displays pop-up notification when error occurs reading file', async () => {
      const fileHandle = {
        getFile: vi.fn().mockRejectedValue(new Error('Corrupted file')),
      };
      const fileItem = opfsItemSchema({ name: 'data.json', kind: 'file', path: 'data.json', handle: fileHandle });
      const { openFile } = useOPFSActions();

      await openFile(fileItem);

      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Failed to Open File',
        message: 'Corrupted file',
        type: 'error',
      });
      expect(opfsStore.isLoading).toBe(false);
    });
  });

  // ----------------------------------------------------------------------------
  // D. Active Document Persistence
  // ----------------------------------------------------------------------------
  describe('Active File Persistence (saveActiveFile)', () => {
    it('[Bad Path] returns failure status if no active file is loaded in store', async () => {
      opfsStore.activeFile = null;
      const { saveActiveFile } = useOPFSActions();

      const result = await saveActiveFile();

      expect(result.success).toBe(false);
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Failed to Save File', type: 'error' })
      );
    });

    it('writes active content to storage file and marks project dirty', async () => {
      const mockWritable = {
        write: vi.fn().mockResolvedValue(true),
        close: vi.fn().mockResolvedValue(true),
      };
      const fileHandle = {
        createWritable: vi.fn().mockResolvedValue(mockWritable),
      };

      const activeItem = opfsItemSchema({ name: 'config.json', path: 'config.json', handle: fileHandle });
      opfsStore.setActiveFile(activeItem, '{"v":1}', '');
      const { saveActiveFile } = useOPFSActions();

      const result = await saveActiveFile();

      expect(fileHandle.createWritable).toHaveBeenCalled();
      expect(mockWritable.write).toHaveBeenCalledWith('{"v":1}');
      expect(mockWritable.close).toHaveBeenCalled();
      expect(mockProjectStore.markAsDirty).toHaveBeenCalled();
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Saved', type: 'success' })
      );
      expect(result).toEqual({ success: true });
      expect(opfsStore.isSaving).toBe(false);
    });

    it('[Bad Path] handles stream write failure to storage (I/O Exception)', async () => {
      const fileHandle = {
        createWritable: vi.fn().mockRejectedValue(new Error('Failed to write stream')),
      };

      const activeItem = opfsItemSchema({ name: 'config.json', path: 'config.json', handle: fileHandle });
      opfsStore.setActiveFile(activeItem, '{"v":1}', '');
      const { saveActiveFile } = useOPFSActions();

      const result = await saveActiveFile();

      expect(result).toEqual({ success: false, error: 'Failed to write stream' });
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Failed to Save File',
        message: 'Failed to write stream',
        type: 'error',
      });
      expect(opfsStore.isSaving).toBe(false);
    });
  });

  // ----------------------------------------------------------------------------
  // E. File and Folder Creation
  // ----------------------------------------------------------------------------
  describe('File or Folder Creation (createEntry)', () => {
    it('creates new file in storage root directory', async () => {
      const mockWritable = { write: vi.fn(), close: vi.fn() };
      const mockFileHandle = { createWritable: vi.fn().mockResolvedValue(mockWritable) };
      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getFileHandle.mockResolvedValue(mockFileHandle);

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);
      const { createEntry } = useOPFSActions();

      const result = await createEntry('index.js', 'file');

      expect(mockRoot.getFileHandle).toHaveBeenCalledWith('index.js', { create: true });
      expect(mockWritable.write).toHaveBeenCalledWith('');
      expect(mockProjectStore.markAsDirty).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('traverses nested path and creates folder in target directory', async () => {
      const mockUiDir = createMockDirectoryHandle('ui');
      const mockSrcDir = createMockDirectoryHandle('src');
      mockSrcDir.getDirectoryHandle.mockResolvedValue(mockUiDir);

      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getDirectoryHandle.mockResolvedValue(mockSrcDir);

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);
      const { createEntry } = useOPFSActions();

      const result = await createEntry('components', 'directory', 'src/ui');

      expect(mockRoot.getDirectoryHandle).toHaveBeenCalledWith('src', { create: true });
      expect(mockSrcDir.getDirectoryHandle).toHaveBeenCalledWith('ui', { create: true });
      expect(mockUiDir.getDirectoryHandle).toHaveBeenCalledWith('components', { create: true });
      expect(result).toEqual({ success: true });
    });

    it('[Bad Path] returns failure status if file creation in storage throws exception', async () => {
      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getFileHandle.mockRejectedValue(new Error('Disk storage full'));

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);
      const { createEntry } = useOPFSActions();

      const result = await createEntry('newfile.js', 'file');

      expect(result).toEqual({ success: false, error: 'Disk storage full' });
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Failed to Create file',
        message: 'Disk storage full',
        type: 'error',
      });
    });
  });

  // ----------------------------------------------------------------------------
  // F. Entry Deletion
  // ----------------------------------------------------------------------------
  describe('File and Folder Deletion (deleteEntry)', () => {
    it('deletes active file entry and clears activeFile state in store', async () => {
      const mockRoot = createMockDirectoryHandle('root');
      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const fileItem = opfsItemSchema({ name: 'test.js', path: 'test.js' });
      opfsStore.setActiveFile(fileItem, 'content', '');
      const { deleteEntry } = useOPFSActions();

      const result = await deleteEntry(fileItem);

      expect(mockRoot.removeEntry).toHaveBeenCalledWith('test.js', { recursive: true });
      expect(opfsStore.activeFile).toBeNull();
      expect(mockProjectStore.markAsDirty).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('traverses nested directory structure to delete target entry', async () => {
      const mockUtilsDir = createMockDirectoryHandle('utils');
      const mockSrcDir = createMockDirectoryHandle('src');
      mockSrcDir.getDirectoryHandle.mockResolvedValue(mockUtilsDir);

      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getDirectoryHandle.mockResolvedValue(mockSrcDir);

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const fileItem = opfsItemSchema({ name: 'old.js', path: 'src/utils/old.js' });
      opfsStore.setActiveFile(fileItem, 'content', '');

      const { deleteEntry } = useOPFSActions();

      const result = await deleteEntry(fileItem);

      expect(mockRoot.getDirectoryHandle).toHaveBeenCalledWith('src');
      expect(mockSrcDir.getDirectoryHandle).toHaveBeenCalledWith('utils');
      expect(mockUtilsDir.removeEntry).toHaveBeenCalledWith('old.js', { recursive: true });
      expect(result).toEqual({ success: true });
    });

    it('[Bad Path] returns error response when attempting to delete non-existent file', async () => {
      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.removeEntry.mockRejectedValue(new Error('Entry not found'));

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const fileItem = opfsItemSchema({ name: 'missing.js', path: 'missing.js' });
      const { deleteEntry } = useOPFSActions();

      const result = await deleteEntry(fileItem);

      expect(result).toEqual({ success: false, error: 'Entry not found' });
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Failed to Delete',
        message: 'Entry not found',
        type: 'error',
      });
    });
  });

  // ----------------------------------------------------------------------------
  // G. Drag & Drop File Upload
  // ----------------------------------------------------------------------------
  describe('Drag & Drop File Upload (handleDropFiles)', () => {
    it('processes files with valid extensions and warns for forbidden extensions', async () => {
      const mockWritable = { write: vi.fn(), close: vi.fn() };
      const mockFileHandle = { createWritable: vi.fn().mockResolvedValue(mockWritable) };
      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getFileHandle.mockResolvedValue(mockFileHandle);

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const files = [
        { name: 'valid.json', type: 'application/json' },
        { name: 'invalid.exe', type: 'application/x-msdownload' },
      ];
      const { handleDropFiles } = useOPFSActions();

      await handleDropFiles(files);

      expect(mockRoot.getFileHandle).toHaveBeenCalledWith('valid.json', { create: true });
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Some Files Rejected', type: 'warning' })
      );
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Upload Successful', type: 'success' })
      );
      expect(mockProjectStore.markAsDirty).toHaveBeenCalled();
    });

    it('[Bad Path] displays error notification when uploaded file write fails', async () => {
      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getFileHandle.mockRejectedValue(new Error('I/O Upload Error'));

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const files = [{ name: 'data.png', type: 'image/png' }];
      const { handleDropFiles } = useOPFSActions();

      await handleDropFiles(files);

      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Failed to Upload File',
        message: 'I/O Upload Error',
        type: 'error',
      });
    });
  });

  // ----------------------------------------------------------------------------
  // H. Cache Cleanup
  // ----------------------------------------------------------------------------
  describe('Local Cache Cleanup (clearCurrentUsersCache)', () => {
    it('resets active file and clears file tree in store', async () => {
      opfsStore.setActiveFile(opfsItemSchema({ name: 'temp.js', path: 'temp.js' }), 'data', '');
      opfsStore.setFileTree([opfsItemSchema({ name: 'temp.js' })]);
      const { clearCurrentUsersCache } = useOPFSActions();

      const result = await clearCurrentUsersCache();

      expect(opfsStore.activeFile).toBeNull();
      expect(opfsStore.fileTree).toEqual([]);
      expect(result).toEqual({ success: true });
    });
  });

  // ----------------------------------------------------------------------------
  // I. Project Export (.lupisproject)
  // ----------------------------------------------------------------------------
  describe('Project File Export (.lupisproject)', () => {
    it('[Bad Path] returns failure response if target project directory is not found in OPFS', async () => {
      const mockProjectsDir = createMockDirectoryHandle('projects');
      mockProjectsDir.getDirectoryHandle.mockRejectedValue(new Error("Directory 'invalid-id' not found."));

      const mockAppDir = createMockDirectoryHandle('lupis-engine');
      mockAppDir.getDirectoryHandle.mockResolvedValue(mockProjectsDir);

      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getDirectoryHandle.mockResolvedValue(mockAppDir);

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const { exportToLupisProject } = useOPFSActions();

      const result = await exportToLupisProject('invalid-id');

      expect(result).toEqual({
        success: false,
        error: "Directory 'invalid-id' not found.",
      });
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Failed to Export Project',
        message: "Directory 'invalid-id' not found.",
        type: 'error',
      });
    });

    it('reads project directory, encodes archive, and triggers file download in DOM', async () => {
      const mockProjectJsonFile = {
        text: vi.fn().mockResolvedValue(JSON.stringify({ name: 'My Game Project' })),
      };
      const mockProjectJsonHandle = {
        getFile: vi.fn().mockResolvedValue(mockProjectJsonFile),
      };

      const mockTargetProjectDir = createMockDirectoryHandle('123');
      mockTargetProjectDir.getFileHandle.mockResolvedValue(mockProjectJsonHandle);

      const mockProjectsDir = createMockDirectoryHandle('projects');
      mockProjectsDir.getDirectoryHandle.mockResolvedValue(mockTargetProjectDir);

      const mockAppDir = createMockDirectoryHandle('lupis-engine');
      mockAppDir.getDirectoryHandle.mockResolvedValue(mockProjectsDir);

      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getDirectoryHandle.mockResolvedValue(mockAppDir);

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const mockEncodedBlob = new Blob(['encoded-data']);
      vi.mocked(encodeLupisProject).mockResolvedValue(mockEncodedBlob);

      const mockAnchor = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      const { exportToLupisProject } = useOPFSActions();

      const result = await exportToLupisProject('123');

      expect(mockAnchor.download).toBe('My_Game_Project.lupisproject');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Export Successful', type: 'success' })
      );
      expect(result).toEqual({ success: true });
    });
  });

  // ----------------------------------------------------------------------------
  // J. Project Import (.lupisproject)
  // ----------------------------------------------------------------------------
  describe('Project File Import (.lupisproject)', () => {
    it('[Bad Path] returns error if project archive is corrupted or lacks project.json', async () => {
      vi.mocked(decodeLupisProject).mockRejectedValue(new Error('Invalid .lupisproject file format'));

      const { importFromLupisProject } = useOPFSActions();
      const mockFile = new File([''], 'invalid.lupisproject');

      const result = await importFromLupisProject(mockFile);

      expect(result).toEqual({
        success: false,
        error: 'Invalid .lupisproject file format',
      });
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Failed to Import Project',
        message: 'Invalid .lupisproject file format',
        type: 'error',
      });
    });

    it('decodes ZIP archive, restores directory structure in OPFS, and rewrites all files', async () => {
      const projectData = { id: 'proj-99', name: 'Imported Project' };
      const mockZipFile = {
        async: vi.fn().mockResolvedValue(JSON.stringify(projectData)),
      };

      const mockZip = {
        file: vi.fn().mockImplementation((path) => (path === 'project.json' ? mockZipFile : null)),
        files: {
          'project.json': { dir: false, async: vi.fn().mockResolvedValue(new Blob(['{}'])) },
        },
      };
      vi.mocked(decodeLupisProject).mockResolvedValue(mockZip);

      const mockTargetProjectDir = createMockDirectoryHandle('proj-99');
      const mockWritable = { write: vi.fn(), close: vi.fn() };
      const mockFileHandle = { createWritable: vi.fn().mockResolvedValue(mockWritable) };
      mockTargetProjectDir.getFileHandle.mockResolvedValue(mockFileHandle);

      const mockProjectsDir = createMockDirectoryHandle('projects');
      mockProjectsDir.getDirectoryHandle.mockResolvedValue(mockTargetProjectDir);

      const mockAppDir = createMockDirectoryHandle('lupis-engine');
      mockAppDir.getDirectoryHandle.mockResolvedValue(mockProjectsDir);

      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getDirectoryHandle.mockResolvedValue(mockAppDir);

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const { importFromLupisProject } = useOPFSActions();
      const mockFile = new File(['content'], 'project.lupisproject');

      const result = await importFromLupisProject(mockFile);

      expect(result).toEqual({
        success: true,
        projectId: 'proj-99',
        projectData,
      });
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Import Successful', type: 'success' })
      );
    });
  });
});