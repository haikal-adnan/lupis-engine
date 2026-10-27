import { describe, it, expect, beforeEach } from 'vitest';
import JSZip from 'jszip';
import {
  generateStandaloneIndexHtml,
  encodeObfuscatedCode,
  obfuscateScriptData,
  encodeToLupisDataBuffer,
  getEngineRuntimeChunks,
  buildClientWebPackage,
  LUPIS_DATA_HEADER,
  LUPIS_XOR_KEY
} from '@/features/export/webExporter.js';
import { decodeLupisProject } from '@utils/projectFormat.js';

describe('Client-Side Web Exporter (Standalone Web .ZIP Without Backend)', () => {
  describe('generateStandaloneIndexHtml', () => {
    it('generates standard HTML5 structure with canvas and modular engine scripts', () => {
      const html = generateStandaloneIndexHtml('My Awesome Game', 'release', 1920, 1080);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>My Awesome Game</title>');
      expect(html).toContain('width: 1920');
      expect(html).toContain('height: 1080');
      expect(html).toContain('<script src="./js/lupis.core.js" defer></script>');
      expect(html).toContain('<script src="./js/lupis.renderer.js" defer></script>');
      expect(html).toContain('<script src="./js/lupis.vm.js" defer></script>');
      expect(html).toContain('<script src="./js/lupis.loader.js" defer></script>');
      expect(html).not.toContain('<!-- Lupis Engine Standalone Web Build (Mode: DEVELOPMENT) -->');
    });

    it('injects development mode badge when mode is development', () => {
      const html = generateStandaloneIndexHtml('Dev Game', 'development', 1280, 720);
      expect(html).toContain('<!-- Lupis Engine Standalone Web Build (Mode: DEVELOPMENT) -->');
      expect(html).toContain('width: 1280');
      expect(html).toContain('height: 720');
    });

    it('sanitizes HTML title to prevent injection', () => {
      const html = generateStandaloneIndexHtml('Game <script>alert(1)</script> & Co');
      expect(html).toContain('<title>Game &lt;script&gt;alert(1)&lt;/script&gt; &amp; Co</title>');
    });
  });

  describe('encodeObfuscatedCode & obfuscateScriptData', () => {
    it('encodes JavaScript code using XOR 0x5A and Base64', () => {
      const code = 'outputs.result = 42;';
      const encoded = encodeObfuscatedCode(code);
      expect(encoded).toBeDefined();
      expect(typeof encoded).toBe('string');
      expect(encoded).not.toBe(code);

      // Decoding test
      const binary = atob(encoded);
      const decodedBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        decodedBytes[i] = binary.charCodeAt(i) ^ 0x5A;
      }
      const restored = new TextDecoder().decode(decodedBytes);
      expect(restored).toBe(code);
    });

    it('obfuscates blueprint script nodes, strips plain text code, and removes layout properties', () => {
      const sampleScript = {
        id: 'script_main',
        folderId: 'f_unused',
        projectId: 'p_unused',
        description: 'Test script',
        nodes: [
          {
            id: 'node_1',
            type: 'Custom',
            code: 'console.log("secret logic");',
            position: { x: 100, y: 200 },
            selected: true,
            dragging: false,
            width: 300,
            height: 150,
            resizing: false,
            inputs: [{ id: 'in_1', dataType: 'execution' }],
            outputs: [{ id: 'out_1', dataType: 'execution' }],
            data: { key: 'val', code: 'console.log("secret logic");' }
          }
        ],
        edges: [
          {
            id: 'edge_1',
            source: 'node_1',
            sourceHandle: 'out_1',
            target: 'node_2',
            targetHandle: 'in_1',
            modifier: 'invert'
          }
        ]
      };

      const obfuscated = obfuscateScriptData(sampleScript);
      expect(obfuscated.folderId).toBeUndefined();
      expect(obfuscated.projectId).toBeUndefined();
      expect(obfuscated.description).toBeUndefined();

      const node = obfuscated.nodes[0];
      expect(node.code).toBeUndefined();
      expect(node.position).toBeUndefined();
      expect(node.selected).toBeUndefined();
      expect(node.dragging).toBeUndefined();
      expect(node.width).toBeUndefined();
      expect(node.height).toBeUndefined();
      expect(node.resizing).toBeUndefined();
      expect(node.data.code).toBeUndefined();
      expect(node.data.key).toBe('val');
      expect(node._c).toBeDefined();
      expect(typeof node._c).toBe('string');
      expect(node.role).toBe('action');

      expect(obfuscated.edges[0]).toEqual({
        id: 'edge_1',
        source: 'node_1',
        sourceHandle: 'out_1',
        target: 'node_2',
        targetHandle: 'in_1',
        modifier: 'invert'
      });
    });
  });

  describe('encodeToLupisDataBuffer', () => {
    it('prepends LUPIS_DATA_HEADER and XORs all bytes with 0x5A', () => {
      const raw = new Uint8Array([1, 2, 3, 4]);
      const encoded = encodeToLupisDataBuffer(raw);
      expect(encoded.length).toBe(LUPIS_DATA_HEADER.length + raw.length);

      for (let i = 0; i < LUPIS_DATA_HEADER.length; i++) {
        expect(encoded[i]).toBe(LUPIS_DATA_HEADER[i]);
      }
      for (let i = 0; i < raw.length; i++) {
        expect(encoded[LUPIS_DATA_HEADER.length + i]).toBe(raw[i] ^ LUPIS_XOR_KEY);
      }
    });
  });

  describe('getEngineRuntimeChunks', () => {
    it('loads 4 modular engine JS chunks for release mode', async () => {
      const chunks = await getEngineRuntimeChunks('release');
      expect(chunks['js/lupis.core.js']).toBeDefined();
      expect(chunks['js/lupis.loader.js']).toBeDefined();
      expect(chunks['js/lupis.renderer.js']).toBeDefined();
      expect(chunks['js/lupis.vm.js']).toBeDefined();
      expect(chunks['js/lupis.core.js.map']).toBeUndefined();
    });

    it('loads engine chunks and source maps for development mode', async () => {
      const chunks = await getEngineRuntimeChunks('development');
      expect(chunks['js/lupis.core.js']).toBeDefined();
      expect(chunks['js/lupis.core.js.map']).toBeDefined();
      expect(chunks['js/lupis.loader.js.map']).toBeDefined();
      expect(chunks['js/lupis.renderer.js.map']).toBeDefined();
      expect(chunks['js/lupis.vm.js.map']).toBeDefined();
    });
  });

  describe('buildClientWebPackage (Full In-Memory OPFS Mock)', () => {
    // In-memory mock for OPFS FileSystemDirectoryHandle and FileSystemFileHandle
    function createMockDirHandle(structure = {}) {
      return {
        kind: 'directory',
        entries: async function* () {
          for (const [name, val] of Object.entries(structure)) {
            if (val && typeof val === 'object' && val.kind === 'directory') {
              yield [name, val];
            } else {
              yield [name, createMockFileHandle(name, val)];
            }
          }
        },
        getFileHandle: async (name) => {
          if (structure[name] === undefined) throw new Error(`File '${name}' not found`);
          return createMockFileHandle(name, structure[name]);
        },
        getDirectoryHandle: async (name) => {
          if (!structure[name] || structure[name].kind !== 'directory') {
            throw new Error(`Directory '${name}' not found`);
          }
          return structure[name];
        }
      };
    }

    function createMockFileHandle(name, content) {
      return {
        kind: 'file',
        name,
        getFile: async () => {
          if (content instanceof Uint8Array || (typeof Buffer !== 'undefined' && Buffer.isBuffer(content))) {
            return new Blob([content]);
          }
          if (typeof content === 'string') {
            return new Blob([content], { type: 'text/plain' });
          }
          return new Blob([JSON.stringify(content)], { type: 'application/json' });
        }
      };
    }

    function createSampleProjectDir() {
      return createMockDirHandle({
        'project.json': {
          id: 'test_project_1',
          name: 'Super Lupis Quest',
          settings: { ui: { width: 1280, height: 720 }, grid: { visible: true }, debug: { active: true } }
        },
        scenes: createMockDirHandle({
          'scene_main.json': { id: 'scene_main', name: 'Main Scene', folderId: 'f1', projectId: 'p1', entities: [] }
        }),
        prefabs: createMockDirHandle({
          'prefab_player.json': { id: 'prefab_player', name: 'Player', folderId: 'f2', projectId: 'p1' }
        }),
        scripts: createMockDirHandle({
          'script_logic.json': {
            id: 'script_logic',
            folderId: 'f3',
            projectId: 'p1',
            nodes: [
              {
                id: 'n1',
                type: 'Custom',
                code: 'outputs.value = 100;',
                position: { x: 50, y: 50 }
              }
            ],
            edges: []
          }
        }),
        workspaces: createMockDirHandle({
          'assets.json': [
            {
              id: 'asset_hero',
              type: 'texture',
              fileKey: 'hero',
              meta: { extension: '.png' },
              localBlob: 'blob://local'
            },
            {
              id: 'asset_font',
              type: 'font',
              fileKey: 'gameFont',
              meta: { fntFile: 'gameFont.fnt', pngFiles: ['gameFont.png'] }
            }
          ],
          'folders.json': [{ id: 'f1', name: 'Folder 1' }],
          'scenes.json': [{ id: 'scene_main', name: 'Main Scene', folderId: 'f1', projectId: 'p1' }],
          'prefabs.json': [{ id: 'prefab_player', name: 'Player', folderId: 'f2', projectId: 'p1' }]
        }),
        assets: createMockDirHandle({
          'hero.png': new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
          'gameFont.fnt': 'info face="Font"',
          'gameFont.png': new Uint8Array([137, 80, 78, 71, 0, 0, 0, 0]),
          'gameFont.ttf': new Uint8Array([0, 1, 0, 0]),
          'logo.png': new Uint8Array([137, 80, 78, 71, 1, 2, 3, 4])
        })
      });
    }

    it('builds development package with unminified OPFS data/ and raw assets', async () => {
      const projectDir = createSampleProjectDir();
      const progressUpdates = [];

      const zipBlob = await buildClientWebPackage({
        projectDirHandle: projectDir,
        mode: 'development',
        projectName: 'Super Lupis Quest',
        onProgress: (percent, text) => progressUpdates.push({ percent, text })
      });

      expect(zipBlob).toBeDefined();
      expect(progressUpdates.length).toBeGreaterThan(0);

      // Unpack generated zip
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(zipBlob);

      // 1. Root files
      expect(loadedZip.file('index.html')).not.toBeNull();
      const indexHtml = await loadedZip.file('index.html').async('text');
      expect(indexHtml).toContain('Super Lupis Quest');
      expect(indexHtml).toContain('width: 1280');
      expect(indexHtml).toContain('height: 720');
      expect(indexHtml).toContain('(Mode: DEVELOPMENT)');

      expect(loadedZip.file('build-info.json')).not.toBeNull();
      const buildInfo = JSON.parse(await loadedZip.file('build-info.json').async('text'));
      expect(buildInfo.mode).toBe('development');
      expect(buildInfo.gameTitle).toBe('Super Lupis Quest');

      // 2. Engine chunks with source maps in development
      expect(loadedZip.file('js/lupis.core.js')).not.toBeNull();
      expect(loadedZip.file('js/lupis.core.js.map')).not.toBeNull();

      // 3. Raw assets in development
      expect(loadedZip.file('assets/hero.png')).not.toBeNull();
      expect(loadedZip.file('assets/gameFont.fnt')).not.toBeNull();
      expect(loadedZip.file('assets/logo.png')).not.toBeNull();

      // 4. Open OPFS structure in data/
      expect(loadedZip.file('data/project.json')).not.toBeNull();
      expect(loadedZip.file('data/scenes/scene_main.json')).not.toBeNull();
      expect(loadedZip.file('data/scripts/script_logic.json')).not.toBeNull();
      expect(loadedZip.file('data/prefabs/prefab_player.json')).not.toBeNull();
      expect(loadedZip.file('data/workspaces/assets.json')).not.toBeNull();

      const assetsJson = JSON.parse(await loadedZip.file('data/workspaces/assets.json').async('text'));
      expect(assetsJson[0].localBlob).toBeUndefined();
      expect(assetsJson[0].meta.protected).toBe(false);
    });

    it('builds release package with single data/game.data, protected .lupisdata assets, and obfuscated code', async () => {
      const projectDir = createSampleProjectDir();

      const zipBlob = await buildClientWebPackage({
        projectDirHandle: projectDir,
        mode: 'release',
        projectName: 'Super Lupis Quest'
      });

      expect(zipBlob).toBeDefined();

      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(zipBlob);

      // 1. Root index.html and build-info
      expect(loadedZip.file('index.html')).not.toBeNull();
      const indexHtml = await loadedZip.file('index.html').async('text');
      expect(indexHtml).not.toContain('(Mode: DEVELOPMENT)');

      const buildInfo = JSON.parse(await loadedZip.file('build-info.json').async('text'));
      expect(buildInfo.mode).toBe('release');

      // 2. Release engine chunks (no .map files)
      expect(loadedZip.file('js/lupis.core.js')).not.toBeNull();
      expect(loadedZip.file('js/lupis.core.js.map')).toBeNull();

      // 3. Assets are encrypted to .lupisdata, TTF is stripped, logo is preserved
      expect(loadedZip.file('assets/hero.png')).toBeNull();
      expect(loadedZip.file('assets/hero.lupisdata')).not.toBeNull();
      expect(loadedZip.file('assets/gameFont_fnt.lupisdata')).not.toBeNull();
      expect(loadedZip.file('assets/gameFont_tex.lupisdata')).not.toBeNull();
      expect(loadedZip.file('assets/gameFont.ttf')).toBeNull();
      expect(loadedZip.file('assets/logo.png')).not.toBeNull();

      // 4. Data contains only game.data
      expect(loadedZip.file('data/game.data')).not.toBeNull();
      expect(loadedZip.file('data/project.json')).toBeNull();
      expect(loadedZip.file('data/scenes/scene_main.json')).toBeNull();

      // 5. Decode data/game.data and verify internal structure
      const gameDataFile = loadedZip.file('data/game.data');
      const gameDataBlob = new Blob([await gameDataFile.async('arraybuffer')]);

      const decodedInnerZip = await decodeLupisProject(gameDataBlob);
      expect(decodedInnerZip.file('project.json')).not.toBeNull();
      expect(decodedInnerZip.file('scenes/scene_main.json')).not.toBeNull();
      expect(decodedInnerZip.file('scripts/script_logic.json')).not.toBeNull();
      expect(decodedInnerZip.file('workspaces/assets.json')).not.toBeNull();
      expect(decodedInnerZip.file('workspaces/folders.json')).toBeNull(); // folders.json stripped in release

      // Verify scripts are obfuscated
      const scriptJson = JSON.parse(await decodedInnerZip.file('scripts/script_logic.json').async('text'));
      const scriptNode = scriptJson.nodes[0];
      expect(scriptNode.code).toBeUndefined();
      expect(scriptNode.position).toBeUndefined();
      expect(scriptNode._c).toBeDefined();

      // Verify workspaces/assets.json references .lupisdata
      const wsAssets = JSON.parse(await decodedInnerZip.file('workspaces/assets.json').async('text'));
      expect(wsAssets[0].meta.protected).toBe(true);
      expect(wsAssets[0].meta.lupisDataFile).toBe('hero.lupisdata');
      expect(wsAssets[1].meta.protected).toBe(true);
      expect(wsAssets[1].meta.fntLupisData).toBe('gameFont_fnt.lupisdata');
      expect(wsAssets[1].meta.texLupisData).toBe('gameFont_tex.lupisdata');
    });
  });
});
