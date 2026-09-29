import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useOPFSStore, useOPFSActions } from '@opfs/opfs.js';
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
const createMockFileHandle = (fileName, content = 'contoh konten') => ({
  kind: 'file',
  getFile: vi.fn().mockResolvedValue({
    text: vi.fn().mockResolvedValue(content),
  }),
  createWritable: vi.fn().mockResolvedValue({
    write: vi.fn().mockResolvedValue(true),
    close: vi.fn().mockResolvedValue(true),
  }),
});

// Helper Mock DirectoryHandle OPFS
const createMockDirectoryHandle = (dirName, entriesMap = new Map()) => ({
  kind: 'directory',
  entries: async function* () {
    for (const entry of entriesMap.entries()) {
      yield entry;
    }
  },
  getDirectoryHandle: vi.fn(),
  getFileHandle: vi.fn(),
  removeEntry: vi.fn().mockResolvedValue(true),
});

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
  // A. Verifikasi Dukungan Browser terhadap OPFS
  // ----------------------------------------------------------------------------
  describe('Dukungan API OPFS Browser', () => {
    it('melempar error saat dijalankan pada browser yang tidak mendukung OPFS', async () => {
      // Arrange
      delete global.navigator.storage;
      const { getUserDirectory } = useOPFSActions();

      // Act & Assert
      await expect(getUserDirectory()).rejects.toThrow('Browser Anda tidak mendukung OPFS.');
    });

    it('mengembalikan root directory handle ketika browser mendukung OPFS', async () => {
      // Arrange
      const mockRoot = createMockDirectoryHandle('root');
      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);
      const { getUserDirectory } = useOPFSActions();

      // Act
      const result = await getUserDirectory();

      // Assert
      expect(result).toBe(mockRoot);
    });
  });

  // ----------------------------------------------------------------------------
  // B. Pemindaian Struktur Direktori dan File
  // ----------------------------------------------------------------------------
  describe('Pemindaian Struktur Folder (refreshTree)', () => {
    it('memindai direktori OPFS secara rekursif dan memperbarui fileTree pada store', async () => {
      // Arrange
      const fileHandle = createMockFileHandle('app.js');
      const subDirHandle = createMockDirectoryHandle('assets');

      const mockRoot = createMockDirectoryHandle(
        'root',
        new Map([
          ['assets', subDirHandle],
          ['app.js', fileHandle],
        ])
      );

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);
      const { refreshTree } = useOPFSActions();

      // Act
      await refreshTree();

      // Assert
      expect(opfsStore.fileTree).toHaveLength(2);
      expect(opfsStore.fileTree[0].name).toBe('assets');
      expect(opfsStore.fileTree[0].kind).toBe('directory');
      expect(opfsStore.fileTree[1].name).toBe('app.js');
      expect(opfsStore.fileTree[1].kind).toBe('file');
      expect(opfsStore.isLoading).toBe(false);
    });

    it('menangani kegagalan akses direktori dengan mencatat pesan error ke store', async () => {
      // Arrange
      global.navigator.storage.getDirectory.mockRejectedValue(new Error('Akses ditolak'));
      const { refreshTree } = useOPFSActions();

      // Act
      await refreshTree();

      // Assert
      expect(opfsStore.errorMessage).toBe('Akses ditolak');
      expect(opfsStore.isLoading).toBe(false);
    });
  });

  // ----------------------------------------------------------------------------
  // C. Operasi Membuka Berkas
  // ----------------------------------------------------------------------------
  describe('Pembacaan File (openFile)', () => {
    it('membaca file teks kode dan memperbarui state activeFile serta fileContent', async () => {
      // Arrange
      const fileHandle = createMockFileHandle('script.js', 'console.log("test");');
      const fileItem = { name: 'script.js', kind: 'file', handle: fileHandle };
      const { openFile } = useOPFSActions();

      // Act
      await openFile(fileItem);

      // Assert
      expect(opfsStore.activeFile).toEqual(fileItem);
      expect(opfsStore.fileContent).toBe('console.log("test");');
      expect(opfsStore.imageUrl).toBe('');
      expect(opfsStore.isLoading).toBe(false);
    });

    it('membuat Blob Object URL saat membuka berkas gambar', async () => {
      // Arrange
      const fileHandle = createMockFileHandle('logo.png');
      const fileItem = { name: 'logo.png', kind: 'file', handle: fileHandle };
      const { openFile } = useOPFSActions();

      // Act
      await openFile(fileItem);

      // Assert
      expect(opfsStore.activeFile).toEqual(fileItem);
      expect(opfsStore.fileContent).toBe('');
      expect(opfsStore.imageUrl).toBe('blob:http://localhost/mock-url');
    });

    it('menampilkan notifikasi pop-up saat terjadi kesalahan pembacaan berkas', async () => {
      // Arrange
      const fileHandle = {
        getFile: vi.fn().mockRejectedValue(new Error('File rusak')),
      };
      const fileItem = { name: 'data.json', kind: 'file', handle: fileHandle };
      const { openFile } = useOPFSActions();

      // Act
      await openFile(fileItem);

      // Assert
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
    it('mengembalikan status gagal jika tidak ada berkas aktif yang terbuka', async () => {
      // Arrange
      const { saveActiveFile } = useOPFSActions();

      // Act
      const result = await saveActiveFile();

      // Assert
      expect(result).toEqual({ success: false });
    });

    it('menulis konten aktif ke file storage dan menandai status proyek dirty', async () => {
      // Arrange
      const mockWritable = { write: vi.fn(), close: vi.fn() };
      const fileHandle = { createWritable: vi.fn().mockResolvedValue(mockWritable) };

      opfsStore.setActiveFile({ name: 'config.json', handle: fileHandle }, '{"v":1}', '');
      const { saveActiveFile } = useOPFSActions();

      // Act
      const result = await saveActiveFile();

      // Assert
      expect(mockWritable.write).toHaveBeenCalledWith('{"v":1}');
      expect(mockWritable.close).toHaveBeenCalled();
      expect(mockProjectStore.markAsDirty).toHaveBeenCalled();
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Tersimpan', type: 'success' })
      );
      expect(result).toEqual({ success: true });
      expect(opfsStore.isSaving).toBe(false);
    });
  });

  // ----------------------------------------------------------------------------
  // E. Pembuatan Entri Berkas dan Folder
  // ----------------------------------------------------------------------------
  describe('Pembuatan Berkas atau Folder Baru (createEntry)', () => {
    it('menolak pembuatan entri apabila nama file hanya berisi spasi atau kosong', async () => {
      // Arrange
      const { createEntry } = useOPFSActions();

      // Act
      const result = await createEntry('   ');

      // Assert
      expect(result).toEqual({ success: false });
    });

    it('membuat berkas baru di direktori root storage', async () => {
      // Arrange
      const mockWritable = { write: vi.fn(), close: vi.fn() };
      const mockFileHandle = { createWritable: vi.fn().mockResolvedValue(mockWritable) };
      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getFileHandle.mockResolvedValue(mockFileHandle);

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);
      const { createEntry } = useOPFSActions();

      // Act
      const result = await createEntry('index.js', 'file');

      // Assert
      expect(mockRoot.getFileHandle).toHaveBeenCalledWith('index.js', { create: true });
      expect(mockWritable.write).toHaveBeenCalledWith('');
      expect(mockProjectStore.markAsDirty).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('menelusuri path tersarang dan membuat folder di direktori tujuan', async () => {
      // Arrange
      const mockUiDir = createMockDirectoryHandle('ui');
      const mockSrcDir = createMockDirectoryHandle('src');
      mockSrcDir.getDirectoryHandle.mockResolvedValue(mockUiDir);

      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getDirectoryHandle.mockResolvedValue(mockSrcDir);

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);
      const { createEntry } = useOPFSActions();

      // Act
      const result = await createEntry('components', 'directory', 'src/ui');

      // Assert
      expect(mockRoot.getDirectoryHandle).toHaveBeenCalledWith('src', { create: true });
      expect(mockSrcDir.getDirectoryHandle).toHaveBeenCalledWith('ui', { create: true });
      expect(mockUiDir.getDirectoryHandle).toHaveBeenCalledWith('components', { create: true });
      expect(result).toEqual({ success: true });
    });
  });

  // ----------------------------------------------------------------------------
  // F. Penghapusan Entri
  // ----------------------------------------------------------------------------
  describe('Penghapusan Berkas dan Folder (deleteEntry)', () => {
    it('menghapus entri berkas aktif dan mengosongkan state activeFile pada store', async () => {
      // Arrange
      const mockRoot = createMockDirectoryHandle('root');
      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const fileItem = { name: 'test.js', path: 'test.js' };
      opfsStore.setActiveFile(fileItem, 'konten', '');
      const { deleteEntry } = useOPFSActions();

      // Act
      const result = await deleteEntry(fileItem);

      // Assert
      expect(mockRoot.removeEntry).toHaveBeenCalledWith('test.js', { recursive: true });
      expect(opfsStore.activeFile).toBeNull();
      expect(mockProjectStore.markAsDirty).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('menelusuri struktur direktori tersarang untuk menghapus entri target', async () => {
      // Arrange
      const mockUtilsDir = createMockDirectoryHandle('utils');
      const mockSrcDir = createMockDirectoryHandle('src');
      mockSrcDir.getDirectoryHandle.mockResolvedValue(mockUtilsDir);

      const mockRoot = createMockDirectoryHandle('root');
      mockRoot.getDirectoryHandle.mockResolvedValue(mockSrcDir);

      global.navigator.storage.getDirectory.mockResolvedValue(mockRoot);

      const fileItem = { name: 'old.js', path: 'src/utils/old.js' };
      const { deleteEntry } = useOPFSActions();

      // Act
      const result = await deleteEntry(fileItem);

      // Assert
      expect(mockRoot.getDirectoryHandle).toHaveBeenCalledWith('src');
      expect(mockSrcDir.getDirectoryHandle).toHaveBeenCalledWith('utils');
      expect(mockUtilsDir.removeEntry).toHaveBeenCalledWith('old.js', { recursive: true });
      expect(result).toEqual({ success: true });
    });
  });

  // ----------------------------------------------------------------------------
  // G. Penanganan Unggah Drag & Drop
  // ----------------------------------------------------------------------------
  describe('Unggah Berkas Drag & Drop (handleDropFiles)', () => {
    it('memproses berkas dengan ekstensi valid dan memberikan peringatan untuk ekstensi yang dilarang', async () => {
      // Arrange
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

      // Act
      await handleDropFiles(files);

      // Assert
      expect(mockRoot.getFileHandle).toHaveBeenCalledWith('valid.json', { create: true });
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Beberapa File Ditolak', type: 'warning' })
      );
      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Unggah Berhasil', type: 'success' })
      );
      expect(mockProjectStore.markAsDirty).toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------------------
  // H. Pembersihan Cache
  // ----------------------------------------------------------------------------
  describe('Pembersihan Cache Lokal (clearCurrentUsersCache)', () => {
    it('mereset file aktif dan mengosongkan pohon berkas di store', async () => {
      // Arrange
      opfsStore.setActiveFile({ name: 'temp.js' }, 'data', '');
      opfsStore.setFileTree([{ name: 'temp.js' }]);
      const { clearCurrentUsersCache } = useOPFSActions();

      // Act
      const result = await clearCurrentUsersCache();

      // Assert
      expect(opfsStore.activeFile).toBeNull();
      expect(opfsStore.fileTree).toEqual([]);
      expect(result).toEqual({ success: true });
    });
  });

  // ----------------------------------------------------------------------------
  // I. Ekspor Proyek (.lupisproject)
  // ----------------------------------------------------------------------------
  describe('Ekspor Berkas Proyek (exportToLupisProject)', () => {
    it('mengembalikan respons gagal apabila ID proyek tidak valid', async () => {
      // Arrange
      global.navigator.storage.getDirectory.mockResolvedValue(createMockDirectoryHandle('root'));
      const { exportToLupisProject } = useOPFSActions();

      // Act
      const result = await exportToLupisProject(null);

      // Assert
      expect(result).toEqual({ success: false, error: 'ID Proyek tidak valid.' });
    });

    it('membaca direktori proyek, melakukan pengkodean, dan memicu unduhan file pada DOM', async () => {
      // Arrange
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

      // Act
      const result = await exportToLupisProject('123');

      // Assert
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
  describe('Impor Berkas Proyek (importFromLupisProject)', () => {
    it('mengembalikan error jika arsip proyek tidak memuat berkas project.json', async () => {
      // Arrange
      const mockZip = {
        file: vi.fn().mockReturnValue(null),
        files: {},
      };
      vi.mocked(decodeLupisProject).mockResolvedValue(mockZip);

      const { importFromLupisProject } = useOPFSActions();
      const mockFile = new File([''], 'test.lupisproject');

      // Act
      const result = await importFromLupisProject(mockFile);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'File tidak valid: "project.json" tidak ditemukan di dalam arsip proyek.',
      });
    });

    it('Mendekode arsip ZIP, mengembalikan struktur direktori di OPFS, dan menulis ulang seluruh berkas', async () => {
      // Arrange
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

      // Act
      const result = await importFromLupisProject(mockFile);

      // Assert
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