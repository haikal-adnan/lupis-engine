/**
 * OPFS (Origin Private File System) Helper Module
 * Centralized utility for handling all local storage operations in Lupis Engine.
 */

const ROOT_APP_DIR = 'lupis-engine';
const PROJECTS_DIR = 'projects';
const ASSETS_DIR = 'assets';

export class OPFSHelper {
  /**
   * Mengambil handle ke direktori assets milik project spesifik.
   * Path: lupis-engine / projects / {projectId} / assets
   * @param {string|number} projectId 
   * @returns {Promise<FileSystemDirectoryHandle>}
   */
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

  /**
   * Reads a file from OPFS and returns a File object.
   * @param {string|number} projectId 
   * @param {string} fileName 
   * @returns {Promise<File>}
   */
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

  /**
   * Writes/Saves Blob or File into OPFS.
   * @param {string|number} projectId 
   * @param {string} fileName 
   * @param {Blob|File|ArrayBuffer|string} content 
   */
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

  /**
   * Deletes a file from OPFS.
   * @param {string|number} projectId 
   * @param {string} fileName 
   */
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

  /**
   * Reads file as Blob URL (used for Image & Font Texture Blob URL).
   * Note: Remember to call URL.revokeObjectURL(url) when finished!
   * @param {string|number} projectId 
   * @param {string} fileName 
   * @returns {Promise<string>}
   */
  static async createBlobUrl(projectId, fileName) {
    const file = await this.getFile(projectId, fileName);
    return URL.createObjectURL(file);
  }

  /**
   * Reads file as ArrayBuffer (used for decodeAudioData Web Audio API).
   * @param {string|number} projectId 
   * @param {string} fileName 
   * @returns {Promise<ArrayBuffer>}
   */
  static async readAsArrayBuffer(projectId, fileName) {
    const file = await this.getFile(projectId, fileName);
    return await file.arrayBuffer();
  }

  /**
   * Reads file as text (used for `.fnt` BMFont/XML).
   * @param {string|number} projectId 
   * @param {string} fileName 
   * @returns {Promise<string>}
   */
  static async readAsText(projectId, fileName) {
    const file = await this.getFile(projectId, fileName);
    return await file.text();
  }

  /**
   * Returns list of all file names in project assets folder.
   * @param {string|number} projectId 
   * @returns {Promise<string[]>}
   */
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

  /**
   * Utility parser to resolve opfs:// URI schemes
   * Supported formats: "opfs://projects/123/asset_key.png" or "opfs://123/asset_key.png"
   * @param {string} opfsUrl 
   * @returns {{ projectId: string, fileName: string } | null}
   */
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