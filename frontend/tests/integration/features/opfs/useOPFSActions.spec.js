import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useOPFSStore, useOPFSActions, opfsItemSchema, getFileTypeByExtension } from '@opfs/opfs.js';
import { useProjectStore } from '@projects/projects.js';
import { usePopAlert } from '@composables/composables.js';
import { encodeLupisProject, decodeLupisProject } from '@utils/projectFormat.js';

// ==============================================================================
// 1. MOCKING DEPENDENSI EKSTERNAL
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
const createMockFileHandle = (fileName, content = 'contoh konten') => {
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
describe('Integrasi useOPFSActions dengan Pinia Store, UI Alert, dan Storage', () => {
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
  // A. Verifikasi Dukungan Browser & Base Helper OPFS
  // ----------------------------------------------------------------------------
  describe('Dukungan API OPFS Browser & Core Executors', () => {
    it('[Bad Path] melempar Error saat dijalankan pada browser yang tidak mendukung OPFS API', async () => {
      delete global.navigator.storage;
      const { getUserDirectory } = useOPFSActions();

      await expect(getUserDirectory()).rejects.toThrow();
    });

    it('mengembalikan root directory handle ketika browser mendukung OPFS', async () => {
      const mockRoot = createMockDirectoryHandle('root');
      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);
      const { getUserDirectory } = useOPFSActions();

      const result = await getUserDirectory();

      expect(result).toBe(mockRoot);
    });

    it('getProjectsRootDirectory mengembalikan handle lupis-engine/projects', async () => {
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

    it('resolveDirectoryPath menavigasi subfolder berdasarkan string atau array path', async () => {
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

    it('writeFileToHandle menulis data ke file handle spesifik', async () => {
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

    it('getFileBlobUrlFromHandle membaca file dan mengembalikan Blob URL', async () => {
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
  // B. Pemindaian Struktur Direktori dan File
  // ----------------------------------------------------------------------------
  describe('Pemindaian Struktur Folder (refreshTree)', () => {
    it('memindai direktori OPFS secara rekursif dan memperbarui fileTree pada store', async () => {
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

    it('[Bad Path] menangani kegagalan akses direktori dengan mencatat pesan error ke store', async () => {
      global.navigator.storage.getDirectory.mockRejectedValue(new Error('Akses ditolak'));
      const { refreshTree } = useOPFSActions();

      await refreshTree();

      expect(opfsStore.errorMessage).toBe('Akses ditolak');
      expect(opfsStore.isLoading).toBe(false);
    });
  });

  // ----------------------------------------------------------------------------
  // C. Operasi Membuka Berkas
  // ----------------------------------------------------------------------------
  describe('Pembacaan File (openFile)', () => {
    it('membaca file teks kode dan memperbarui state activeFile serta fileContent', async () => {
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

    it('membuat Blob Object URL saat membuka berkas gambar', async () => {
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

    it('[Bad Path] menampilkan notifikasi pop-up saat terjadi kesalahan pembacaan berkas', async () => {
      const fileHandle = {
        getFile: vi.fn().mockRejectedValue(new Error('File rusak')),
      };
      const fileItem = opfsItemSchema({ name: 'data.json', kind: 'file', path: 'data.json', handle: fileHandle });
      const { openFile } = useOPFSActions();

      await openFile(fileItem);

      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Gagal Membuka File',
        message: 'File rusak',
        type: 'error',
      });
      expect(opfsStore.isLoading).toBe(false);
    });
  });

  // ----------------------------------------------------------------------------
  // D. Pengisian dan Penyimpanan Dokumen Aktif
  // ----------------------------------------------------------------------------
  describe('Penyimpanan Berkas Aktif (saveActiveFile)', () => {
    it('[Bad Path] mengembalikan status gagal jika tidak ada berkas aktif yang terpasang di store', async () => {
      opfsStore.activeFile = null;
      const { saveActiveFile } = useOPFSActions();

      const result = await saveActiveFile();

      expect(result.success).toBe(false);
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Gagal Menyimpan File', type: 'error' })
      );
    });

    it('menulis konten aktif ke file storage dan menandai status proyek dirty', async () => {
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
        expect.objectContaining({ title: 'Tersimpan', type: 'success' })
      );
      expect(result).toEqual({ success: true });
      expect(opfsStore.isSaving).toBe(false);
    });

    it('[Bad Path] menangani kegagalan penulisan stream ke storage (I/O Exception)', async () => {
      const fileHandle = {
        createWritable: vi.fn().mockRejectedValue(new Error('Gagal menulis stream')),
      };

      const activeItem = opfsItemSchema({ name: 'config.json', path: 'config.json', handle: fileHandle });
      opfsStore.setActiveFile(activeItem, '{"v":1}', '');
      const { saveActiveFile } = useOPFSActions();

      const result = await saveActiveFile();

      expect(result).toEqual({ success: false, error: 'Gagal menulis stream' });
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Gagal Menyimpan File',
        message: 'Gagal menulis stream',
        type: 'error',
      });
      expect(opfsStore.isSaving).toBe(false);
    });
  });

  // ----------------------------------------------------------------------------
  // E. Pembuatan Entri Berkas dan Folder
  // ----------------------------------------------------------------------------
  describe('Pembuatan Berkas atau Folder Baru (createEntry)', () => {
    it('membuat berkas baru di direktori root storage', async () => {
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

    it('menelusuri path tersarang dan membuat folder di direktori tujuan', async () => {
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

    it('[Bad Path] mengembalikan status gagal jika proses pembuatan berkas di storage melempar exception', async () => {
      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getFileHandle.mockRejectedValue(new Error('Kapasitas disk penuh'));

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);
      const { createEntry } = useOPFSActions();

      const result = await createEntry('newfile.js', 'file');

      expect(result).toEqual({ success: false, error: 'Kapasitas disk penuh' });
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Gagal Membuat file',
        message: 'Kapasitas disk penuh',
        type: 'error',
      });
    });
  });

  // ----------------------------------------------------------------------------
  // F. Penghapusan Entri
  // ----------------------------------------------------------------------------
  describe('Penghapusan Berkas dan Folder (deleteEntry)', () => {
    it('menghapus entri berkas aktif dan mengosongkan state activeFile pada store', async () => {
      const mockRoot = createMockDirectoryHandle('root');
      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const fileItem = opfsItemSchema({ name: 'test.js', path: 'test.js' });
      opfsStore.setActiveFile(fileItem, 'konten', '');
      const { deleteEntry } = useOPFSActions();

      const result = await deleteEntry(fileItem);

      expect(mockRoot.removeEntry).toHaveBeenCalledWith('test.js', { recursive: true });
      expect(opfsStore.activeFile).toBeNull();
      expect(mockProjectStore.markAsDirty).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('menelusuri struktur direktori tersarang untuk menghapus entri target', async () => {
      const mockUtilsDir = createMockDirectoryHandle('utils');
      const mockSrcDir = createMockDirectoryHandle('src');
      mockSrcDir.getDirectoryHandle.mockResolvedValue(mockUtilsDir);

      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getDirectoryHandle.mockResolvedValue(mockSrcDir);

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const fileItem = opfsItemSchema({ name: 'old.js', path: 'src/utils/old.js' });
      opfsStore.setActiveFile(fileItem, 'konten', '');

      const { deleteEntry } = useOPFSActions();

      const result = await deleteEntry(fileItem);

      expect(mockRoot.getDirectoryHandle).toHaveBeenCalledWith('src');
      expect(mockSrcDir.getDirectoryHandle).toHaveBeenCalledWith('utils');
      expect(mockUtilsDir.removeEntry).toHaveBeenCalledWith('old.js', { recursive: true });
      expect(result).toEqual({ success: true });
    });

    it('[Bad Path] mengembalikan respon error saat mencoba menghapus berkas yang tidak ditemukan', async () => {
      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.removeEntry.mockRejectedValue(new Error('Entry not found'));

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const fileItem = opfsItemSchema({ name: 'missing.js', path: 'missing.js' });
      const { deleteEntry } = useOPFSActions();

      const result = await deleteEntry(fileItem);

      expect(result).toEqual({ success: false, error: 'Entry not found' });
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Gagal Menghapus',
        message: 'Entry not found',
        type: 'error',
      });
    });
  });

  // ----------------------------------------------------------------------------
  // G. Penanganan Unggah Drag & Drop
  // ----------------------------------------------------------------------------
  describe('Unggah Berkas Drag & Drop (handleDropFiles)', () => {
    it('memproses berkas dengan ekstensi valid dan memberikan peringatan untuk ekstensi yang dilarang', async () => {
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
        expect.objectContaining({ title: 'Beberapa File Ditolak', type: 'warning' })
      );
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Unggah Berhasil', type: 'success' })
      );
      expect(mockProjectStore.markAsDirty).toHaveBeenCalled();
    });

    it('[Bad Path] menampilkan notifikasi error saat penulisan berkas unggahan gagal', async () => {
      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getFileHandle.mockRejectedValue(new Error('I/O Upload Error'));

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const files = [{ name: 'data.png', type: 'image/png' }];
      const { handleDropFiles } = useOPFSActions();

      await handleDropFiles(files);

      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Gagal Mengunggah File',
        message: 'I/O Upload Error',
        type: 'error',
      });
    });
  });

  // ----------------------------------------------------------------------------
  // H. Pembersihan Cache
  // ----------------------------------------------------------------------------
  describe('Pembersihan Cache Lokal (clearCurrentUsersCache)', () => {
    it('mereset file aktif dan mengosongkan pohon berkas di store', async () => {
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
  // I. Ekspor Proyek (.lupisproject)
  // ----------------------------------------------------------------------------
  describe('Ekspor Berkas Proyek (.lupisproject)', () => {
    it('[Bad Path] mengembalikan respons gagal apabila direktori proyek target tidak ditemukan di OPFS', async () => {
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
        title: 'Gagal Ekspor Proyek',
        message: "Directory 'invalid-id' not found.",
        type: 'error',
      });
    });

    it('membaca direktori proyek, melakukan pengkodean, dan memicu unduhan file pada DOM', async () => {
      const mockProjectJsonFile = {
        text: vi.fn().mockResolvedValue(JSON.stringify({ name: 'Proyek Game Saya' })),
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

      const mockEncodedBlob = new Blob(['data-terenkode']);
      vi.mocked(encodeLupisProject).mockResolvedValue(mockEncodedBlob);

      const mockAnchor = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      const { exportToLupisProject } = useOPFSActions();

      const result = await exportToLupisProject('123');

      expect(mockAnchor.download).toBe('Proyek_Game_Saya.lupisproject');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Ekspor Berhasil', type: 'success' })
      );
      expect(result).toEqual({ success: true });
    });
  });

  // ----------------------------------------------------------------------------
  // J. Impor Proyek (.lupisproject)
  // ----------------------------------------------------------------------------
  describe('Impor Berkas Proyek (.lupisproject)', () => {
    it('[Bad Path] mengembalikan error jika arsip proyek terkorupsi atau tidak memuat project.json', async () => {
      vi.mocked(decodeLupisProject).mockRejectedValue(new Error('Format berkas .lupisproject tidak valid'));

      const { importFromLupisProject } = useOPFSActions();
      const mockFile = new File([''], 'invalid.lupisproject');

      const result = await importFromLupisProject(mockFile);

      expect(result).toEqual({
        success: false,
        error: 'Format berkas .lupisproject tidak valid',
      });
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Gagal Import Proyek',
        message: 'Format berkas .lupisproject tidak valid',
        type: 'error',
      });
    });

    it('Mendekode arsip ZIP, mengembalikan struktur direktori di OPFS, dan menulis ulang seluruh berkas', async () => {
      const projectData = { id: 'proj-99', name: 'Proyek Hasil Impor' };
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
      const mockFile = new File(['konten'], 'project.lupisproject');

      const result = await importFromLupisProject(mockFile);

      expect(result).toEqual({
        success: true,
        projectId: 'proj-99',
        projectData,
      });
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Import Berhasil', type: 'success' })
      );
    });
  });
});