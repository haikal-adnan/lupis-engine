import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getOrBuildCachedEngineChunks
} from '../../service/bundler/engineBundler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDITOR_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(EDITOR_DIR, '..');
const CORE_DIR = path.resolve(ROOT_DIR, 'core');
const MANIFEST_PATH = path.resolve(ROOT_DIR, 'service/config/manifest.runtime.json');
const TARGET_RUNTIME_DIR = path.resolve(EDITOR_DIR, 'public/engine-runtime');

function getEngineFilesFromManifest() {
  const fileSet = new Set(['index.html', 'Runtime.js']);
  if (fs.existsSync(MANIFEST_PATH)) {
    const data = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    if (data.entry) Object.values(data.entry).forEach((f) => f && fileSet.add(f));
    if (Array.isArray(data.modules)) data.modules.forEach((f) => fileSet.add(f));
    if (data.assets) {
      Object.values(data.assets).forEach((list) => {
        if (Array.isArray(list)) list.forEach((f) => fileSet.add(f));
      });
    }
  }
  return Array.from(fileSet);
}

async function getEngineFileBuffer(relPath, engineDir) {
  const fullPath = path.join(engineDir, relPath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath);
  }
  return null;
}

export async function bundleRuntimeToPublic() {
  console.log('[bundleRuntime] Bundling engine runtime chunks into editor/public/engine-runtime...');
  const filesToExport = getEngineFilesFromManifest();

  for (const mode of ['release', 'development']) {
    const outDir = path.join(TARGET_RUNTIME_DIR, mode);
    fs.mkdirSync(outDir, { recursive: true });

    const chunks = await getOrBuildCachedEngineChunks({
      filesToExport,
      engineDir: CORE_DIR,
      getEngineFileBufferFn: getEngineFileBuffer,
      mode,
      forceRebuild: true
    });

    for (const [relPath, content] of Object.entries(chunks)) {
      const baseName = path.basename(relPath);
      fs.writeFileSync(path.join(outDir, baseName), content, 'utf-8');
    }
    console.log(`[bundleRuntime] Successfully wrote ${mode} chunks to ${outDir}`);
  }
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  bundleRuntimeToPublic()
    .then(() => {
      console.log('[bundleRuntime] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[bundleRuntime] Error:', err);
      process.exit(1);
    });
}
