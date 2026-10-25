const ROOT_APP_DIR = 'lupis-engine';
const PROJECTS_DIR = 'projects';
const ASSETS_DIR = 'assets';

export class OPFSHelper {
  // Returns directory handle for a project's assets folder (lupis-engine/projects/{projectId}/assets)
  static async getProjectAssetsDir(projectId) {
    try {
      const root = await navigator.storage.getDirectory();
      const appDir = await root.getDirectoryHandle(ROOT_APP_DIR, { create: true });
      const projectsDir = await appDir.getDirectoryHandle(PROJECTS_DIR, { create: true });
      const projectDir = await projectsDir.getDirectoryHandle(String(projectId), { create: true });
      return await projectDir.getDirectoryHandle(ASSETS_DIR, { create: true });
    } catch (error) {
      console.error(`[OPFSHelper] Failed to access assets directory for project [${projectId}]:`, error);
      throw error;
    }
  }

  static async getFile(projectId, fileName) {
    try {
      const assetsDir = await this.getProjectAssetsDir(projectId);
      const fileHandle = await assetsDir.getFileHandle(fileName);
      return await fileHandle.getFile();
    } catch (error) {
      console.error(`[OPFSHelper] Failed to retrieve file "${fileName}" (Project: ${projectId}):`, error);
      throw error;
    }
  }

  static async saveFile(projectId, fileName, content) {
    try {
      const assetsDir = await this.getProjectAssetsDir(projectId);
      const fileHandle = await assetsDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      
      await writable.write(content);
      await writable.close();
      return true;
    } catch (error) {
      console.error(`[OPFSHelper] Failed to save file "${fileName}" (Project: ${projectId}):`, error);
      throw error;
    }
  }

  static async deleteFile(projectId, fileName) {
    try {
      const assetsDir = await this.getProjectAssetsDir(projectId);
      await assetsDir.removeEntry(fileName);
      return true;
    } catch (error) {
      console.warn(`[OPFSHelper] Failed to delete file "${fileName}" (Project: ${projectId}):`, error);
      return false;
    }
  }

  // Caller is responsible for calling URL.revokeObjectURL(url) when finished
  static async createBlobUrl(projectId, fileName) {
    const file = await this.getFile(projectId, fileName);
    return URL.createObjectURL(file);
  }

  static async readAsArrayBuffer(projectId, fileName) {
    const file = await this.getFile(projectId, fileName);
    return await file.arrayBuffer();
  }

  static async readAsText(projectId, fileName) {
    const file = await this.getFile(projectId, fileName);
    return await file.text();
  }

  static async listAssetFiles(projectId) {
    try {
      const assetsDir = await this.getProjectAssetsDir(projectId);
      const files = [];
      for await (const entry of assetsDir.values()) {
        if (entry.kind === 'file') {
          files.push(entry.name);
        }
      }
      return files;
    } catch (error) {
      console.error(`[OPFSHelper] Failed to list files (Project: ${projectId}):`, error);
      return [];
    }
  }

  // Resolves "opfs://projects/{id}/{file}" or "opfs://{id}/{file}"
  static parseOpfsUrl(opfsUrl) {
    if (!opfsUrl || !opfsUrl.startsWith('opfs://')) return null;
    const cleanPath = opfsUrl.replace('opfs://', '');
    const parts = cleanPath.split('/').filter(Boolean);

    if (parts.length < 2) return null;

    const projectId = parts[0] === PROJECTS_DIR ? parts[1] : parts[0];
    const fileName = parts[parts.length - 1];

    return { projectId, fileName };
  }
}

export default OPFSHelper;
