import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SettingsTabPublish from '@settings/projects/layouts/section/SettingsTabPublish.vue';
import LupisPackageHelper from '../../../../../core/Util/LupisPackageHelper.js';
import {
  classifyEngineChunk,
  bundleEngineChunks,
  buildUnifiedWebPackage,
  computeEngineHash,
  getOrBuildCachedEngineChunks,
  clearRuntimeMemoryCache,
  processProjectDataForExport,
  generateStandaloneIndexHtml,
  createStandaloneBootCode
} from '../../../../../service/bundler/engineBundler.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

const mockExportApp = vi.fn().mockResolvedValue({ success: true });
const mockDownloadExeFile = vi.fn();
const mockCloseExportModal = vi.fn();
const mockExportToLupisProject = vi.fn().mockResolvedValue({ success: true });
const mockShowPop = vi.fn();

vi.mock('@composables/composables.js', () => ({
  useExportApp: () => ({
    isExporting: ref(false),
    exportType: ref('exe'),
    exportMode: ref('release'),
    exeDownloadUrl: ref('http://localhost:37602/api/download-app/exe/proj_test_123?mode=release&name=My_Super_Game'),
    exeDownloadUrls: ref({
      development: 'http://localhost:37602/api/download-app/exe/proj_test_123?mode=development',
      release: 'http://localhost:37602/api/download-app/exe/proj_test_123?mode=release'
    }),
    showExportModal: ref(false),
    closeExportModal: mockCloseExportModal,
    exportApp: mockExportApp,
    downloadExeFile: mockDownloadExeFile
  }),
  usePopAlert: () => ({
    showPop: mockShowPop
  })
}));

vi.mock('@opfs/opfs.js', () => ({
  useOPFSActions: () => ({
    exportToLupisProject: mockExportToLupisProject,
    isLoading: ref(false)
  })
}));

describe('SettingsTabPublish & Unified Export Architecture (Development vs Release)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('renders Development and Release buttons for both Web (.ZIP) and Desktop (.EXE) exports', async () => {
    const wrapper = mount(SettingsTabPublish, {
      props: {
        info: { id: 'proj_test_123' }
      }
    });

    const webDevBtn = wrapper.find('[data-testid="export-web-dev-btn"]');
    const webRelBtn = wrapper.find('[data-testid="export-web-release-btn"]');
    const exeDevBtn = wrapper.find('[data-testid="export-exe-dev-btn"]');
    const exeRelBtn = wrapper.find('[data-testid="export-exe-release-btn"]');

    expect(webDevBtn.exists()).toBe(true);
    expect(webRelBtn.exists()).toBe(true);
    expect(exeDevBtn.exists()).toBe(true);
    expect(exeRelBtn.exists()).toBe(true);

    await webDevBtn.trigger('click');
    expect(mockExportApp).toHaveBeenCalledWith('proj_test_123', 'zip', 'development');

    await webRelBtn.trigger('click');
    expect(mockExportApp).toHaveBeenCalledWith('proj_test_123', 'zip', 'release');

    await exeDevBtn.trigger('click');
    expect(mockExportApp).toHaveBeenCalledWith('proj_test_123', 'exe', 'development');

    await exeRelBtn.trigger('click');
    expect(mockExportApp).toHaveBeenCalledWith('proj_test_123', 'exe', 'release');
  });

  it('does not render inline download buttons on the publish tab (relies exclusively on modal popup)', () => {
    const wrapper = mount(SettingsTabPublish, {
      props: {
        info: { id: 'proj_test_123', name: 'My Super Game' }
      }
    });

    expect(wrapper.find('[data-testid="download-exe-dev-btn"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="download-exe-release-btn"]').exists()).toBe(false);
  });

  it('triggers download with project name and clears build on modal close', async () => {
    const wrapper = mount(SettingsTabPublish, {
      props: {
        info: { id: 'proj_test_123', name: 'My Super Game' }
      }
    });

    const modal = wrapper.findComponent({ name: 'ExportAppModal' });
    expect(modal.exists()).toBe(true);

    // When modal emits download
    await modal.vm.$emit('download');
    expect(mockDownloadExeFile).toHaveBeenCalledWith('proj_test_123', 'release', 'My Super Game');

    // When modal emits close
    await modal.vm.$emit('close');
    expect(mockCloseExportModal).toHaveBeenCalledWith('proj_test_123');
  });

  it('renders Target Project name instead of project id in footer', () => {
    const wrapper = mount(SettingsTabPublish, {
      props: {
        info: { id: 'proj_test_123', name: 'My Super Game' }
      }
    });

    const targetProject = wrapper.find('[data-testid="target-project-name"]');
    expect(targetProject.exists()).toBe(true);
    expect(targetProject.text()).toBe('My Super Game');
  });

  it('classifies engine runtime modules into the 4 modular JS chunks', () => {
    expect(classifyEngineChunk('Runtime.js')).toBe('lupis.loader.js');
    expect(classifyEngineChunk('Loader/RuntimeLoader.js')).toBe('lupis.loader.js');
    expect(classifyEngineChunk('Util/LupisPackageHelper.js')).toBe('lupis.loader.js');
    expect(classifyEngineChunk('Core/Game.js')).toBe('lupis.core.js');
    expect(classifyEngineChunk('System/PhysicsSystem.js')).toBe('lupis.core.js');
    expect(classifyEngineChunk('Renderer/RendererManager.js')).toBe('lupis.renderer.js');
    expect(classifyEngineChunk('Assets/Fonts/defaultFont.js')).toBe('lupis.renderer.js');
    expect(classifyEngineChunk('Script/ScriptRunner.js')).toBe('lupis.vm.js');
    expect(classifyEngineChunk('Toolkit/Platformer/PlatformerHelper.js')).toBe('lupis.vm.js');
  });

  it('generates Source Maps (.map) and readable modules in development mode vs obfuscated chunks in release mode', async () => {
    const sampleFiles = [
      'Core/Config.js',
      'Renderer/Graphic/GLContext.js',
      'Script/VariableManager.js',
      'Runtime.js'
    ];
    const mockGetBuffer = async (relPath) => {
      if (relPath === 'Core/Config.js') {
        return Buffer.from('const Config = { ENGINE_MODE: "runtime" };\nexport default Config;\n');
      }
      if (relPath === 'Renderer/Graphic/GLContext.js') {
        return Buffer.from('export default class GLContext { init() { return "webgl2_ready"; } }\n');
      }
      if (relPath === 'Script/VariableManager.js') {
        return Buffer.from('// Variable comment\nexport default class VariableManager { getVar() { return "secret_variable_token"; } }\n');
      }
      if (relPath === 'Runtime.js') {
        return Buffer.from('import Config from "./Core/Config.js";\nexport async function startEngine() { return Config.ENGINE_MODE; }\n');
      }
      return null;
    };

    const devOut = await bundleEngineChunks({
      filesToExport: sampleFiles,
      engineDir: '',
      getEngineFileBufferFn: mockGetBuffer,
      mode: 'development'
    });

    expect(devOut['js/lupis.core.js']).toContain('sourceMappingURL=lupis.core.js.map');
    expect(devOut['js/lupis.core.js.map']).toBeDefined();
    expect(devOut['js/lupis.renderer.js.map']).toBeDefined();
    expect(devOut['js/lupis.vm.js.map']).toBeDefined();
    expect(devOut['js/lupis.loader.js.map']).toBeDefined();
    expect(devOut['js/lupis.vm.js']).toContain('// Variable comment');
    expect(devOut['js/lupis.vm.js']).toContain('secret_variable_token');

    const relOut = await bundleEngineChunks({
      filesToExport: sampleFiles,
      engineDir: '',
      getEngineFileBufferFn: mockGetBuffer,
      mode: 'release'
    });

    expect(relOut['js/lupis.core.js.map']).toBeUndefined();
    expect(relOut['js/lupis.renderer.js.map']).toBeUndefined();
    expect(relOut['js/lupis.vm.js.map']).toBeUndefined();
    expect(relOut['js/lupis.loader.js.map']).toBeUndefined();
    expect(relOut['js/lupis.vm.js']).not.toContain('// Variable comment');
    expect(relOut['js/lupis.vm.js']).toMatch(/__reg\.m\._0x/);
  });

  it('builds OPFS-like data/ folder in development mode and single data/game.data + .lupisdata in release mode', async () => {
    const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'lupis-pkg-test-'));
    try {
      const createDummyProject = (dir) => {
        fs.mkdirSync(path.join(dir, 'scenes'), { recursive: true });
        fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
        fs.mkdirSync(path.join(dir, 'workspaces'), { recursive: true });
        fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
        fs.writeFileSync(path.join(dir, 'project.json'), JSON.stringify({ id: 'p1', name: 'Test Game' }));
        fs.writeFileSync(path.join(dir, 'scenes', 'scene_1.json'), JSON.stringify({ id: 'scene_1', entities: [] }));
        fs.writeFileSync(path.join(dir, 'scripts', 'script_1.json'), JSON.stringify({
          id: 'script_1',
          nodes: [{ id: 'node_orig', type: 'Custom', code: 'outputs.val = 42;' }],
          edges: []
        }));
        fs.writeFileSync(path.join(dir, 'workspaces', 'assets.json'), JSON.stringify([
          { id: 'a1', type: 'texture', fileKey: 'hero', meta: { extension: '.png' } }
        ]));
        fs.writeFileSync(path.join(dir, 'assets', 'hero.png'), Buffer.from([137, 80, 78, 71]));
      };

      const mockGetBuffer = async () => Buffer.from('export async function startEngine() {}\n');

      // 1. Test Development Package
      const devExtract = path.join(tmpBase, 'dev_extract');
      const devOutDir = path.join(tmpBase, 'dev_out');
      createDummyProject(devExtract);

      await buildUnifiedWebPackage({
        projectExtractDir: devExtract,
        outputDir: devOutDir,
        mode: 'development',
        filesToExport: ['Runtime.js'],
        engineDir: '',
        getEngineFileBufferFn: mockGetBuffer,
        obfuscateAndProtectProjectFn: () => {},
        packDirectoryToLupisProjectFileFn: async () => {}
      });

      expect(fs.existsSync(path.join(devOutDir, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(devOutDir, 'js', 'lupis.core.js.map'))).toBe(true);
      expect(fs.existsSync(path.join(devOutDir, 'data', 'project.json'))).toBe(true);
      expect(fs.existsSync(path.join(devOutDir, 'data', 'scenes', 'scene_1.json'))).toBe(true);
      expect(fs.existsSync(path.join(devOutDir, 'data', 'scripts', 'script_1.json'))).toBe(true);
      expect(fs.existsSync(path.join(devOutDir, 'assets', 'hero.png'))).toBe(true);

      // 2. Test Release Package
      const relExtract = path.join(tmpBase, 'rel_extract');
      const relOutDir = path.join(tmpBase, 'rel_out');
      createDummyProject(relExtract);

      await buildUnifiedWebPackage({
        projectExtractDir: relExtract,
        outputDir: relOutDir,
        mode: 'release',
        filesToExport: ['Runtime.js'],
        engineDir: '',
        getEngineFileBufferFn: mockGetBuffer,
        obfuscateAndProtectProjectFn: (dir) => {
          fs.writeFileSync(path.join(dir, 'assets', 'hero.lupisdata'), Buffer.from('LUPIS_DATA'));
          fs.unlinkSync(path.join(dir, 'assets', 'hero.png'));
        },
        packDirectoryToLupisProjectFileFn: async (srcDir, destFile) => {
          fs.writeFileSync(destFile, Buffer.from('LUPIS_PROJECT1!\0BINARY'));
        }
      });

      expect(fs.existsSync(path.join(relOutDir, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(relOutDir, 'js', 'lupis.core.js.map'))).toBe(false);
      expect(fs.existsSync(path.join(relOutDir, 'data', 'game.data'))).toBe(true);
      expect(fs.existsSync(path.join(relOutDir, 'data', 'project.json'))).toBe(false);
      expect(fs.existsSync(path.join(relOutDir, 'data', 'scenes'))).toBe(false);
      expect(fs.existsSync(path.join(relOutDir, 'assets', 'hero.lupisdata'))).toBe(true);
      expect(fs.existsSync(path.join(relOutDir, 'assets', 'hero.png'))).toBe(false);
    } finally {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
  });

  it('normalizes data/ virtual keys and resolves root assets base URL in LupisPackageHelper', () => {
    expect(LupisPackageHelper._normalizeVirtualKey('./data/project.json')).toBe('project.json');
    expect(LupisPackageHelper._normalizeVirtualKey('./data/scenes/scene_1.json')).toBe('scenes/scene_1.json');
    expect(LupisPackageHelper.resolveAssetBaseUrl('./data')).toBe('.');
    expect(LupisPackageHelper.resolveAssetBaseUrl('./project')).toBe('./project');
  });

  it('computes deterministic engine runtime hash and detects mode / file variations', () => {
    const files = ['Core/Config.js', 'Runtime.js'];
    const hashRel = computeEngineHash(files, '', 'release');
    const hashDev = computeEngineHash(files, '', 'development');
    expect(hashRel).toBeDefined();
    expect(hashDev).toBeDefined();
    expect(hashRel).not.toBe(hashDev);

    const hashSame = computeEngineHash(files, '', 'release');
    expect(hashSame).toBe(hashRel);
  });

  it('reuses pre-bundled engine runtime chunks from cache in 1x run without recompiling', async () => {
    clearRuntimeMemoryCache();
    const tmpCache = fs.mkdtempSync(path.join(os.tmpdir(), 'lupis-cache-test-'));
    try {
      const mockGetBuffer = async (rel) => Buffer.from(`// File: ${rel}\nexport default {};\n`);
      const files = ['Core/Config.js', 'Runtime.js'];

      // First run: builds and caches chunks
      const firstRun = await getOrBuildCachedEngineChunks({
        filesToExport: files,
        engineDir: '',
        getEngineFileBufferFn: mockGetBuffer,
        mode: 'release',
        cacheDir: tmpCache
      });
      expect(firstRun['js/lupis.core.js']).toBeDefined();
      expect(firstRun['js/lupis.loader.js']).toBeDefined();

      // Disk cache verification
      expect(fs.existsSync(path.join(tmpCache, 'runtime', 'release', 'meta.json'))).toBe(true);

      // Second run: retrieved from in-memory cache instantly
      let recompiled = false;
      const secondRun = await getOrBuildCachedEngineChunks({
        filesToExport: files,
        engineDir: '',
        getEngineFileBufferFn: async () => {
          recompiled = true;
          return Buffer.from('');
        },
        mode: 'release',
        cacheDir: tmpCache
      });
      expect(recompiled).toBe(false);
      expect(secondRun['js/lupis.core.js']).toBe(firstRun['js/lupis.core.js']);

      // Clear memory cache to test disk cache reload
      clearRuntimeMemoryCache();
      const thirdRun = await getOrBuildCachedEngineChunks({
        filesToExport: files,
        engineDir: '',
        getEngineFileBufferFn: async () => {
          recompiled = true;
          return Buffer.from('');
        },
        mode: 'release',
        cacheDir: tmpCache
      });
      expect(recompiled).toBe(false);
      expect(thirdRun['js/lupis.core.js']).toBe(firstRun['js/lupis.core.js']);
    } finally {
      fs.rmSync(tmpCache, { recursive: true, force: true });
    }
  });

  it('processes project data directly in 1 pass using processProjectDataForExport', async () => {
    const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'lupis-data-pass-'));
    try {
      const projDir = path.join(tmpBase, 'proj');
      const outDir = path.join(tmpBase, 'out');
      fs.mkdirSync(path.join(projDir, 'assets'), { recursive: true });
      fs.writeFileSync(path.join(projDir, 'project.json'), JSON.stringify({ name: 'FastGame' }));
      fs.writeFileSync(path.join(projDir, 'assets', 'sound.ogg'), Buffer.from([1, 2, 3]));

      let obfuscated = false;
      let packed = false;
      const { gameTitle } = await processProjectDataForExport({
        projectExtractDir: projDir,
        outputDir: outDir,
        mode: 'release',
        obfuscateAndProtectProjectFn: async (dir) => {
          obfuscated = true;
          fs.writeFileSync(path.join(dir, 'assets', 'sound.lupisdata'), Buffer.from([4, 5, 6]));
          fs.unlinkSync(path.join(dir, 'assets', 'sound.ogg'));
        },
        packDirectoryToLupisProjectFileFn: async (dir, dest) => {
          packed = true;
          fs.writeFileSync(dest, Buffer.from('LUPIS_DATA'));
        }
      });

      expect(gameTitle).toBe('FastGame');
      expect(obfuscated).toBe(true);
      expect(packed).toBe(true);
      expect(fs.existsSync(path.join(outDir, 'data', 'game.data'))).toBe(true);
      expect(fs.existsSync(path.join(outDir, 'assets', 'sound.lupisdata'))).toBe(true);
    } finally {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
  });

  it('generates standalone index.html without CSS width:100% force on lp_canvas_preview and preserves black background', () => {
    const html = generateStandaloneIndexHtml('My RPG', 'release', 1920, 1080);
    expect(html).toContain('<title>My RPG</title>');
    expect(html).toContain('background: #000000;');
    expect(html).toContain('max-width: 100%;');
    expect(html).toContain('max-height: 100%;');
    // Ensure CSS does not force stretch width/height to 100%
    expect(html).not.toMatch(/#lp_canvas_preview\s*\{[^}]*(?<![\w-])width:\s*100%/);
  });

  it('preserves aspect ratio letterboxing for web standalone while keeping 100% windowed fill for desktop app in bootstrapper code', () => {
    const bootCode = createStandaloneBootCode('Runtime.js', 'release');
    expect(bootCode).toContain('const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI);');
    expect(bootCode).toContain('if (isElectron && !isFullscreen && !isMaximized)');
    expect(bootCode).toContain('Math.round(finalW) + "px"');
    expect(bootCode).toContain('Math.round(finalH) + "px"');

    // Simulate behavior under Web Standalone environment (no window.electronAPI)
    const simulateResize = ({ winW, winH, targetW, targetH, isElectron, isMaximized = false, isFullscreen = false }) => {
      const targetRatio = targetW / targetH;
      const canvasStyle = { width: '', height: '' };

      if (isElectron && !isFullscreen && !isMaximized) {
        canvasStyle.width = '100%';
        canvasStyle.height = '100%';
        return canvasStyle;
      }

      const winRatio = winW / winH;
      let finalW, finalH;
      if (winRatio > targetRatio) {
        finalH = winH;
        finalW = finalH * targetRatio;
      } else {
        finalW = winW;
        finalH = winW / targetRatio;
      }
      canvasStyle.width = Math.round(finalW) + 'px';
      canvasStyle.height = Math.round(finalH) + 'px';
      return canvasStyle;
    };

    // Web Standalone: Window is 1920x800 (wide / letterbox needed)
    const webWide = simulateResize({ winW: 1920, winH: 800, targetW: 1920, targetH: 1080, isElectron: false });
    expect(webWide.width).toBe('1422px');
    expect(webWide.height).toBe('800px');

    // Web Standalone: Window is 800x1080 (tall / pillarbox needed)
    const webTall = simulateResize({ winW: 800, winH: 1080, targetW: 1920, targetH: 1080, isElectron: false });
    expect(webTall.width).toBe('800px');
    expect(webTall.height).toBe('450px');

    // Desktop App (Electron): Normal windowed mode fills 100% (window frame handles aspect ratio)
    const desktopWindowed = simulateResize({ winW: 1280, winH: 720, targetW: 1920, targetH: 1080, isElectron: true });
    expect(desktopWindowed.width).toBe('100%');
    expect(desktopWindowed.height).toBe('100%');

    // Desktop App (Electron): Maximized mode letterboxes
    const desktopMaximized = simulateResize({ winW: 1920, winH: 800, targetW: 1920, targetH: 1080, isElectron: true, isMaximized: true });
    expect(desktopMaximized.width).toBe('1422px');
    expect(desktopMaximized.height).toBe('800px');
  });
});
