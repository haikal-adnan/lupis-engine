import { computed } from 'vue';
import JSZip from 'jszip';
import { useOPFSStore, getFileTypeByExtension } from '@opfs/opfs.js';
import { useProjectStore } from '@projects/projects.js';
import { usePopAlert } from '@composables/composables.js';
import { encodeLupisProject, decodeLupisProject } from '@utils/projectFormat.js';

export function useOPFSActions() {
  const opfsStore = useOPFSStore();
  const projectStore = useProjectStore();
  const { showPop } = usePopAlert();

  const isLoading = computed(() => opfsStore.isLoading);
  const isSaving = computed(() => opfsStore.isSaving);

  const getUserDirectory = async () => {
    return await navigator.storage.getDirectory();
  };

  const getProjectsRootDirectory = async () => {
    const root = await getUserDirectory();
    const appDir = await root.getDirectoryHandle('lupis-engine', { create: true });
    return await appDir.getDirectoryHandle('projects', { create: true });
  };

  const resolveDirectoryPath = async (baseHandle, targetPath, options = { create: true }) => {
    const parts = Array.isArray(targetPath) 
      ? targetPath 
      : targetPath.split('/').filter(Boolean);

    let currentDir = baseHandle;
    for (const part of parts) {
      currentDir = await currentDir.getDirectoryHandle(part, options);
    }
    return currentDir;
  };

  const writeFileToHandle = async (dirHandle, fileName, content) => {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  };

  const removeFileFromHandle = async (dirHandle, fileName) => {
    try {
      await dirHandle.removeEntry(fileName);
    } catch (err) {
      console.warn(`[OPFS Executor] File "${fileName}" failed to delete or was not found:`, err);
    }
  };

  const getFileBlobUrlFromHandle = async (dirHandle, fileName) => {
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  };

  const scanDirectory = async (dirHandle, path = '') => {
    const items = [];
    if (typeof dirHandle.entries !== 'function') return items;

    const entriesIterable = dirHandle.entries();
    for await (const entry of entriesIterable) {
      if (!Array.isArray(entry)) continue;
      const [name, handle] = entry;
      const itemPath = path ? `${path}/${name}` : name;
      
      if (handle.kind === 'directory') {
        const children = await scanDirectory(handle, itemPath);
        items.push({ name, kind: 'directory', path: itemPath, handle, children });
      } else {
        items.push({ name, kind: 'file', path: itemPath, handle });
      }
    }

    return items.sort((a, b) => {
      if (a.kind === b.kind) return a.name.localeCompare(b.name);
      return a.kind === 'directory' ? -1 : 1;
    });
  };

  const refreshTree = async () => {
    opfsStore.setLoading(true);
    try {
      const userDir = await getUserDirectory();
      const tree = await scanDirectory(userDir);
      opfsStore.setFileTree(tree);
    } catch (error) {
      console.error('Failed to scan OPFS:', error);
      opfsStore.setError(error.message);
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const initProjectStructure = async () => {
    opfsStore.setLoading(true);
    try {
      await refreshTree();
    } catch (error) {
      showPop({ title: 'OPFS Initialization Failed', message: error.message, type: 'error' });
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const openFile = async (fileItem) => {
    opfsStore.setLoading(true);
    try {
      const file = await fileItem.handle.getFile();
      const fileType = getFileTypeByExtension(fileItem.name);

      if (fileType === 'code') {
        const textContent = await file.text();
        opfsStore.setActiveFile(fileItem, textContent, '');
      } else if (fileType === 'image') {
        const url = URL.createObjectURL(file);
        opfsStore.setActiveFile(fileItem, '', url);
      } else {
        opfsStore.setActiveFile(fileItem, '', '');
      }
    } catch (error) {
      showPop({ title: 'Failed to Open File', message: error.message, type: 'error' });
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const saveActiveFile = async (contentOverride = null) => {
    if (!opfsStore.activeFile || !opfsStore.activeFile.handle) {
      showPop({ title: 'Failed to Save File', message: 'No active file to save.', type: 'error' });
      return { success: false, error: 'No active file to save.' };
    }

    opfsStore.setSaving(true);
    try {
      const contentToSave = contentOverride !== null ? contentOverride : opfsStore.fileContent;
      
      const writable = await opfsStore.activeFile.handle.createWritable();
      await writable.write(contentToSave);
      await writable.close();

      projectStore.markAsDirty();
      showPop({ title: 'Saved', message: `File ${opfsStore.activeFile.name} saved to OPFS.`, type: 'success' });
      return { success: true };
    } catch (error) {
      showPop({ title: 'Failed to Save File', message: error.message, type: 'error' });
      return { success: false, error: error.message };
    } finally {
      opfsStore.setSaving(false);
    }
  };

  const createEntry = async (name, type = 'file', targetDirPath = '') => {
    opfsStore.setLoading(true);
    try {
      const root = await getUserDirectory();
      const targetDir = targetDirPath ? await resolveDirectoryPath(root, targetDirPath) : root;

      if (type === 'file') {
        await writeFileToHandle(targetDir, name, '');
      } else {
        await targetDir.getDirectoryHandle(name, { create: true });
      }

      projectStore.markAsDirty();
      return { success: true };
    } catch (error) {
      showPop({ title: `Failed to Create ${type}`, message: error.message, type: 'error' });
      return { success: false, error: error.message };
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const deleteEntry = async (item) => {
    opfsStore.setLoading(true);
    try {
      const root = await getUserDirectory();
      const parts = item.path.split('/');
      const targetName = parts.pop();
      let currentDir = root;

      for (const part of parts) {
        currentDir = await currentDir.getDirectoryHandle(part);
      }
      await currentDir.removeEntry(targetName, { recursive: true });

      const activePath = opfsStore.activeFile.path;
      if (activePath === item.path || activePath.startsWith(item.path + '/')) {
        opfsStore.clearActiveFile();
      }

      projectStore.markAsDirty();
      showPop({ title: 'Successfully Deleted', message: `"${item.name}" has been deleted.`, type: 'info' });
      return { success: true };
    } catch (error) {
      showPop({ title: 'Failed to Delete', message: error.message, type: 'error' });
      return { success: false, error: error.message };
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const handleDropFiles = async (files, targetDirPath = '') => {
    opfsStore.setLoading(true);
    const saved = [];
    const rejected = [];

    try {
      const root = await getUserDirectory();
      const targetDir = targetDirPath ? await resolveDirectoryPath(root, targetDirPath) : root;

      for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (opfsStore.allowedExtensions.includes(ext)) {
          await writeFileToHandle(targetDir, file.name, file);
          saved.push(file.name);
        } else {
          rejected.push(file.name);
        }
      }

      if (rejected.length) {
        showPop({ title: 'Some Files Rejected', message: `Unsupported extension: ${rejected.join(', ')}`, type: 'warning' });
      }
      if (saved.length) {
        projectStore.markAsDirty();
        showPop({ title: 'Upload Successful', message: `${saved.length} file(s) added to OPFS.`, type: 'success' });
      }
    } catch (error) {
      showPop({ title: 'Failed to Upload File', message: error.message, type: 'error' });
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const clearCurrentUsersCache = async () => {
    try {
      opfsStore.clearActiveFile();
      opfsStore.setFileTree([]);
      showPop({ title: 'Cache Cleared', message: 'Local project folder cache has been cleared.', type: 'info' });
      return { success: true };
    } catch (error) {
      console.warn('Cache is already clean or not found:', error);
      return { success: false, error: error.message };
    }
  };

  const _addDirectoryToZip = async (dirHandle, zipFolder) => {
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file') {
        const file = await handle.getFile();
        zipFolder.file(name, file);
      } else if (handle.kind === 'directory') {
        await _addDirectoryToZip(handle, zipFolder.folder(name));
      }
    }
  };

  const _writeZipEntryToOPFS = async (zipObject, targetDirHandle) => {
    for (const relativePath of Object.keys(zipObject.files)) {
      const entry = zipObject.files[relativePath];
      if (entry.dir) continue;

      const parts = relativePath.split('/');
      const fileName = parts.pop();
      
      const currentDir = parts.length > 0 
        ? await resolveDirectoryPath(targetDirHandle, parts) 
        : targetDirHandle;

      const contentBlob = await entry.async('blob');
      await writeFileToHandle(currentDir, fileName, contentBlob);
    }
  };

  const exportToLupisProject = async (projectId = null) => {
    opfsStore.setLoading(true);
    try {
      const projectsRootDir = await getProjectsRootDirectory();
      const targetProjectDir = await resolveDirectoryPath(projectsRootDir, String(projectId), { create: false });

      let fileName = String(projectId);
      try {
        const projectJsonHandle = await targetProjectDir.getFileHandle('project.json');
        const projectJsonFile = await projectJsonHandle.getFile();
        const projectData = JSON.parse(await projectJsonFile.text());

        const sanitizedName = projectData.name.trim().replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
        fileName = sanitizedName;
      } catch (e) {
        console.warn('Failed to read name from project.json, using ID as filename:', e);
      }

      const zip = new JSZip();
      await _addDirectoryToZip(targetProjectDir, zip);

      const rawZipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });

      const encodedBlob = await encodeLupisProject(rawZipBlob);

      const url = URL.createObjectURL(encodedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.lupisproject`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showPop({
        title: 'Export Successful',
        message: `Project '${fileName}' successfully saved as .lupisproject.`,
        type: 'success'
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to export .lupisproject:', error);
      showPop({ title: 'Failed to Export Project', message: error.message, type: 'error' });
      return { success: false, error: error.message };
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const importFromLupisProject = async (file) => {
    opfsStore.setLoading(true);
    try {
      const loadedZip = await decodeLupisProject(file);

      const projectJsonFile = loadedZip.file('project.json') || 
        loadedZip.file(Object.keys(loadedZip.files).find(k => k.endsWith('project.json')));

      const projectData = JSON.parse(await projectJsonFile.async('text'));
      const projectId = String(projectData.id);

      const projectsRootDir = await getProjectsRootDirectory();
      const targetProjectDir = await resolveDirectoryPath(projectsRootDir, projectId);

      await _writeZipEntryToOPFS(loadedZip, targetProjectDir);

      showPop({
        title: 'Import Successful',
        message: `Project "${projectData.name}" successfully imported.`,
        type: 'success'
      });

      return { success: true, projectId, projectData };
    } catch (error) {
      console.error('Failed to import .lupisproject:', error);
      showPop({ title: 'Failed to Import Project', message: error.message, type: 'error' });
      return { success: false, error: error.message };
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const refreshProjectTree = async (projectId) => {
    opfsStore.setLoading(true);
    try {
      const projectsRootDir = await getProjectsRootDirectory();
      const targetProjectDir = await resolveDirectoryPath(projectsRootDir, String(projectId), { create: true });
      const tree = await scanDirectory(targetProjectDir);
      opfsStore.setFileTree(tree);
    } catch (error) {
      console.error('Failed to scan OPFS project folder:', error);
      opfsStore.setError(error.message);
    } finally {
      opfsStore.setLoading(false);
    }
  };

  return {
    getUserDirectory,
    getProjectsRootDirectory,
    resolveDirectoryPath,
    writeFileToHandle,
    removeFileFromHandle,
    getFileBlobUrlFromHandle,
    refreshProjectTree,
    refreshTree,
    initProjectStructure,
    openFile,
    saveActiveFile,
    createEntry,
    deleteEntry,
    handleDropFiles,
    clearCurrentUsersCache,
    exportToLupisProject,
    importFromLupisProject,
    isLoading,
    isSaving
  };
}