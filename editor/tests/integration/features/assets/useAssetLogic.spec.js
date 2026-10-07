import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAssetStore, useAssetLogic } from '@assets/assets.js';
import { useFolderStore } from '@folders/folders.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { usePopImage, usePopAudio, usePopAlert } from '@composables/composables.js';
import { setupMockOPFS } from '@tests/tests.js';

// Mock dependency eksternal composables di luar sistem yang diuji
vi.mock('@composables/composables.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    usePopImage: vi.fn(),
    usePopAudio: vi.fn(),
    usePopAlert: vi.fn(() => ({
      showPop: vi.fn()
    }))
  };
});

describe('Integration Test: Asset Logic UI & State Navigation', () => {
  let assetStore;
  let folderStore;
  let workspaceStore;
  let mockShowImage;
  let mockShowAudio;
  let mockShowPop;

  beforeEach(async () => {
    setActivePinia(createPinia());

    // Inisialisasi simulator in-memory OPFS pada navigator.storage
    setupMockOPFS();

    assetStore = useAssetStore();
    folderStore = useFolderStore();
    workspaceStore = useWorkspaceStore();

    // Inisialisasi project aktif agar penyusunan path OPFS bekerja valid
    workspaceStore.activeProjectId = 'proj-123';

    // Mock global HTMLImageElement agar `new Image()` memicu `onload`
    global.Image = class MockImage {
      constructor() {
        this._src = '';
        this.width = 100;
        this.height = 100;
        this.onload = null;
      }
      set src(val) {
        this._src = val;
        queueMicrotask(() => {
          if (typeof this.onload === 'function') this.onload();
        });
      }
      get src() {
        return this._src;
      }
    };

    // Mock global HTMLAudioElement agar `new Audio()` memicu `onloadedmetadata`
    global.Audio = class MockAudio {
      constructor() {
        this._src = '';
        this.duration = 10;
        this.onloadedmetadata = null;
      }
      set src(val) {
        this._src = val;
        queueMicrotask(() => {
          if (typeof this.onloadedmetadata === 'function') this.onloadedmetadata();
        });
      }
      get src() {
        return this._src;
      }
    };

    global.URL.createObjectURL = vi.fn((file) => `blob:mock-url-${file?.name || 'file'}`);
    global.URL.revokeObjectURL = vi.fn();

    // Mock modal preview image, audio & alert
    mockShowImage = vi.fn();
    mockShowAudio = vi.fn();
    mockShowPop = vi.fn();

    vi.mocked(usePopImage).mockReturnValue({ showImage: mockShowImage });
    vi.mocked(usePopAudio).mockReturnValue({ showAudio: mockShowAudio });
    vi.mocked(usePopAlert).mockReturnValue({ showPop: mockShowPop });

    // Setup state dasar folderStore
    folderStore.folders = [
      { id: 'root', parentId: null, name: 'Root', section: 'assets' },
      { id: 'f-1', parentId: 'root', name: 'Sprites', section: 'assets' },
      { id: 'f-2', parentId: 'f-1', name: 'Hero', section: 'assets' },
      { id: 'f-other', parentId: 'root', name: 'Other Section', section: 'scenes' }
    ];
    folderStore.activeFolderId = 'f-1';
    folderStore.getFolderById = vi.fn((id) => folderStore.folders.find((f) => f.id === id));
    folderStore.setActiveFolder = vi.fn((id) => {
      folderStore.activeFolderId = id;
    });
    folderStore.moveFolder = vi.fn(async (id, targetId) => {
      const f = folderStore.getFolderById(id);
      if (f) f.parentId = targetId;
    });

    // Setup state dasar assetStore lengkap dengan fileKey & meta
    assetStore.assets = [
      { id: 'a-1', name: 'B Knight', fileKey: 'image_b_knight', folderId: 'f-1', type: 'texture', meta: { extension: '.png', hasBmFont: false } },
      { id: 'a-2', name: 'A Apple', fileKey: 'audio_a_apple', folderId: 'f-1', type: 'audio', meta: { extension: '.wav', hasBmFont: false } },
      { id: 'a-3', name: 'Sub Item', fileKey: 'image_sub_item', folderId: 'f-2', type: 'texture', meta: { extension: '.png', hasBmFont: false } }
    ];

    // Pre-create file dummy pada simulator OPFS dengan struktur baru: lupis-engine/projects/proj-123/assets
    const rootDir = await navigator.storage.getDirectory();
    const appDir = await rootDir.getDirectoryHandle('lupis-engine', { create: true });
    const projectsDir = await appDir.getDirectoryHandle('projects', { create: true });
    const projectDir = await projectsDir.getDirectoryHandle('proj-123', { create: true });
    const assetsDir = await projectDir.getDirectoryHandle('assets', { create: true });

    await assetsDir.getFileHandle('image_b_knight.png', { create: true });
    await assetsDir.getFileHandle('audio_a_apple.wav', { create: true });
    await assetsDir.getFileHandle('image_sub_item.png', { create: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Breadcrumbs, Filtering & Sorting State', () => {
    it('menghasilkan hirarki breadcrumbs folder dengan urutan yang benar dari root ke folder aktif', () => {
      folderStore.activeFolderId = 'f-2';
      const { folderBreadcrumbs } = useAssetLogic();

      expect(folderBreadcrumbs.value).toEqual([
        expect.objectContaining({ id: 'root', name: 'Root' }),
        expect.objectContaining({ id: 'f-1', name: 'Sprites' }),
        expect.objectContaining({ id: 'f-2', name: 'Hero' })
      ]);
    });

    it('menyaring dan mengurutkan folder & asset berdasarkan searchQuery dan folder yang aktif', () => {
      assetStore.assets.push(
        { id: 'a-4', name: 'A Armor', fileKey: 'image_a_armor', folderId: 'f-1', type: 'texture', meta: { extension: '.png' } }
      );
      const { visibleFolders, visibleAssets, searchQuery } = useAssetLogic();

      expect(visibleFolders.value).toHaveLength(1);
      expect(visibleFolders.value[0].name).toBe('Hero');
      expect(visibleAssets.value.map((a) => a.displayName)).toEqual(['A Apple', 'A Armor', 'B Knight']);

      searchQuery.value = 'apple';
      expect(visibleAssets.value).toHaveLength(1);
      expect(visibleAssets.value[0].displayName).toBe('A Apple');
    });

    it('mengubah viewMode antara grid dan list', () => {
      const { viewMode, toggleViewMode } = useAssetLogic();

      expect(viewMode.value).toBe('grid');
      toggleViewMode();
      expect(viewMode.value).toBe('list');
      toggleViewMode();
      expect(viewMode.value).toBe('grid');
    });

    it('berpindah folder aktif dan mereset kriteria pencarian serta seleksi item', () => {
      const { navigateTo, searchQuery, selectedId } = useAssetLogic();
      searchQuery.value = 'test';
      selectedId.value = 'a-1';

      navigateTo({ id: 'f-2', name: 'Hero' });

      expect(folderStore.setActiveFolder).toHaveBeenCalledWith('f-2');
      expect(searchQuery.value).toBe('');
      expect(selectedId.value).toBeNull();
    });
  });

  describe('Interaksi File Upload, Drag & Drop, dan Clipboard Operations', () => {
    it('memicu file input click dan mengimpor seluruh berkas yang dipilih pada event upload', async () => {
      const { fileInputRef, triggerUpload, handleFileUpload } = useAssetLogic();
      const mockClick = vi.fn();
      fileInputRef.value = { click: mockClick };

      const file1 = new File(['1'], 'a.png', { type: 'image/png' });
      const file2 = new File(['2'], 'b.png', { type: 'image/png' });
      const event = { target: { files: [file1, file2], value: 'fakepath' } };

      triggerUpload();
      await handleFileUpload(event);

      expect(mockClick).toHaveBeenCalled();
      expect(assetStore.assets.some((a) => a.name === 'a')).toBe(true);
      expect(assetStore.assets.some((a) => a.name === 'b')).toBe(true);
      expect(event.target.value).toBe('');
    });

    it('menangani drop data internal JSON untuk memindahkan item asset/folder ke target folder', async () => {
      const { handleDrop } = useAssetLogic();
      const dropEvent = {
        dataTransfer: {
          getData: vi.fn((type) =>
            type === 'application/json' ? JSON.stringify({ id: 'a-1', type: 'asset' }) : ''
          ),
          files: []
        }
      };

      await handleDrop(dropEvent, 'f-2');

      expect(assetStore.assets.find((a) => a.id === 'a-1').folderId).toBe('f-2');
    });

    it('menangani drop berkas file sistem eksternal dan mengimpor berkas tersebut', async () => {
      const { handleDrop } = useAssetLogic();
      const droppedFile = new File(['bytes'], 'dropped.png', { type: 'image/png' });
      const dropEvent = {
        dataTransfer: {
          getData: vi.fn(() => ''),
          files: [droppedFile]
        }
      };

      await handleDrop(dropEvent, 'f-1');

      expect(assetStore.assets.some((a) => a.name === 'dropped')).toBe(true);
    });

    it('menjalankan aksi paste untuk operasi cut (move item)', async () => {
      const { clipboard, handlePaste } = useAssetLogic();
      clipboard.value = { action: 'cut', item: { id: 'a-1', type: 'asset' } };

      await handlePaste();

      expect(assetStore.assets.find((a) => a.id === 'a-1').folderId).toBe('f-1');
      expect(clipboard.value).toBeNull();
    });

    it('menjalankan aksi paste untuk operasi copy (duplicate asset)', async () => {
      const { clipboard, handlePaste } = useAssetLogic();
      clipboard.value = { action: 'copy', item: { id: 'a-1', type: 'asset' } };

      await handlePaste();

      expect(assetStore.assets.some((a) => a.name === 'B Knight (Copy)')).toBe(true);
    });
  });

  describe('Asset Double Click Preview Modal', () => {
    it('membuka modal pratinjau gambar saat double-click pada asset ber-tipe texture', async () => {
      const { handleAssetDoubleClick } = useAssetLogic();
      const textureAsset = assetStore.getAssetById('a-1');

      await handleAssetDoubleClick({ ...textureAsset, displayName: textureAsset.name });

      expect(mockShowImage).toHaveBeenCalledWith(expect.stringContaining('blob:mock-url'), 'B Knight');
    });

    it('membuka modal pratinjau audio saat double-click pada asset ber-tipe audio/sound', async () => {
      const { handleAssetDoubleClick } = useAssetLogic();
      const audioAsset = assetStore.getAssetById('a-2');

      await handleAssetDoubleClick({ ...audioAsset, displayName: audioAsset.name });

      expect(mockShowAudio).toHaveBeenCalledWith(expect.stringContaining('blob:mock-url'), 'A Apple');
    });
  });

  describe('Pencegahan Error / Safe Execution', () => {
    it('mengabaikan aksi paste tanpa melempar error jika clipboard bernilai null', async () => {
      const { clipboard, handlePaste } = useAssetLogic();
      clipboard.value = null;

      await expect(handlePaste()).resolves.not.toThrow();
    });
  });
});