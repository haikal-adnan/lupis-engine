import { computed } from 'vue';
import JSZip from 'jszip';
import { useOPFSStore } from '@opfs/opfs.js';
import { useProjectStore } from '@projects/projects.js';
import { usePopAlert } from '@composables/composables.js';
import { encodeLupisProject, decodeLupisProject } from '@utils/projectFormat.js';

export function useOPFSActions() {
  const opfsStore = useOPFSStore();
  const projectStore = useProjectStore();
  const { showPop } = usePopAlert();

  const isLoading = computed(() => opfsStore.isLoading);
  const isSaving = computed(() => opfsStore.isSaving);

  const _ensureOPFSSupport = () => {
    if (!navigator.storage || !navigator.storage.getDirectory) {
      throw new Error('Browser Anda tidak mendukung OPFS.');
    }
  };

  const getUserDirectory = async () => {
    _ensureOPFSSupport();
    return await navigator.storage.getDirectory();
  };

  const scanDirectory = async (dirHandle, path = '') => {
    const items = [];
    for await (const [name, handle] of dirHandle.entries()) {
      const itemPath = path ? `${path}/${name}` : name;
      if (handle.kind === 'directory') {
        const children = await scanDirectory(handle, itemPath);
        items.push({ name, kind: 'directory', path: itemPath, handle, isOpen: false, children });
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
      console.error('Gagal memindai OPFS:', error);
      opfsStore.setError(error.message);
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const initProjectStructure = async () => {
    opfsStore.setLoading(true);
    try {
      await getUserDirectory();
      await refreshTree();
    } catch (error) {
      showPop({ title: 'Inisialisasi OPFS Gagal', message: error.message, type: 'error' });
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const openFile = async (fileItem) => {
    if (!fileItem || fileItem.kind !== 'file') return;
    opfsStore.setLoading(true);
    try {
      const file = await fileItem.handle.getFile();
      const ext = fileItem.name.split('.').pop().toLowerCase();
      if (['js', 'json', 'scene', 'prefab'].includes(ext)) {
        const textContent = await file.text();
        opfsStore.setActiveFile(fileItem, textContent, '');
      } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        const url = URL.createObjectURL(file);
        opfsStore.setActiveFile(fileItem, '', url);
      } else {
        opfsStore.setActiveFile(fileItem, '', '');
      }
    } catch (error) {
      showPop({ title: 'Gagal Membuka File', message: error.message, type: 'error' });
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const saveActiveFile = async (contentOverride = null) => {
    if (!opfsStore.activeFile) return { success: false };
    opfsStore.setSaving(true);
    try {
      const contentToSave = contentOverride !== null ? contentOverride : opfsStore.fileContent;
      const writable = await opfsStore.activeFile.handle.createWritable();
      await writable.write(contentToSave);
      await writable.close();
      projectStore.markAsDirty();
      showPop({ title: 'Tersimpan', message: `File ${opfsStore.activeFile.name} disimpan ke OPFS.`, type: 'success' });
      return { success: true };
    } catch (error) {
      showPop({ title: 'Gagal Menyimpan File', message: error.message, type: 'error' });
      return { success: false, error: error.message };
    } finally {
      opfsStore.setSaving(false);
    }
  };

  const createEntry = async (name, type = 'file', targetDirPath = '') => {
    if (!name.trim()) return { success: false };
    opfsStore.setLoading(true);
    try {
      _ensureOPFSSupport();
      const root = await navigator.storage.getDirectory();
      let targetDir = root;
      if (targetDirPath) {
        const parts = targetDirPath.split('/');
        for (const part of parts) {
          if (part) targetDir = await targetDir.getDirectoryHandle(part, { create: true });
        }
      }
      if (type === 'file') {
        const fileHandle = await targetDir.getFileHandle(name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write('');
        await writable.close();
      } else {
        await targetDir.getDirectoryHandle(name, { create: true });
      }
      projectStore.markAsDirty();
      return { success: true };
    } catch (error) {
      showPop({ title: `Gagal Membuat ${type}`, message: error.message, type: 'error' });
      return { success: false, error: error.message };
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const deleteEntry = async (item) => {
    opfsStore.setLoading(true);
    try {
      _ensureOPFSSupport();
      const root = await navigator.storage.getDirectory();
      if (item.path.includes('/')) {
        const parts = item.path.split('/');
        const targetName = parts.pop();
        let currentDir = root;
        for (const part of parts) {
          if (part) currentDir = await currentDir.getDirectoryHandle(part);
        }
        await currentDir.removeEntry(targetName, { recursive: true });
      } else {
        await root.removeEntry(item.name, { recursive: true });
      }
      if (opfsStore.activeFile?.path === item.path || opfsStore.activeFile?.path.startsWith(item.path + '/')) {
        opfsStore.clearActiveFile();
      }
      projectStore.markAsDirty();
      showPop({ title: 'Berhasil Dihapus', message: `"${item.name}" telah dihapus.`, type: 'info' });
      return { success: true };
    } catch (error) {
      showPop({ title: 'Gagal Menghapus', message: error.message, type: 'error' });
      return { success: false, error: error.message };
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const handleDropFiles = async (files, targetDirPath = '') => {
    if (!files || !files.length) return;
    opfsStore.setLoading(true);
    const saved = [];
    const rejected = [];
    try {
      _ensureOPFSSupport();
      const root = await navigator.storage.getDirectory();
      let targetDir = root;
      if (targetDirPath) {
        const parts = targetDirPath.split('/');
        for (const part of parts) {
          if (part) targetDir = await targetDir.getDirectoryHandle(part, { create: true });
        }
      }
      for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (opfsStore.allowedExtensions.includes(ext)) {
          const fileHandle = await targetDir.getFileHandle(file.name, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(file);
          await writable.close();
          saved.push(file.name);
        } else {
          rejected.push(file.name);
        }
      }
      if (rejected.length) {
        showPop({ title: 'Beberapa File Ditolak', message: `Ekstensi tidak didukung: ${rejected.join(', ')}`, type: 'warning' });
      }
      if (saved.length) {
        projectStore.markAsDirty();
        showPop({ title: 'Unggah Berhasil', message: `${saved.length} file ditambahkan ke OPFS.`, type: 'success' });
      }
    } catch (error) {
      showPop({ title: 'Gagal Mengunggah File', message: error.message, type: 'error' });
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const clearCurrentUsersCache = async () => {
    try {
      opfsStore.clearActiveFile();
      opfsStore.setFileTree([]);
      showPop({ title: 'Cache Dibersihkan', message: 'Folder proyek lokal telah dibersihkan.', type: 'info' });
      return { success: true };
    } catch (error) {
      console.warn('Cache sudah bersih atau tidak ditemukan:', error);
      return { success: false, error: error.message };
    }
  };

  const _addDirectoryToZip = async (dirHandle, zipFolder) => {
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file') {
        const file = await handle.getFile();
        zipFolder.file(name, file);
      } else if (handle.kind === 'directory') {
        const subZipFolder = zipFolder.folder(name);
        await _addDirectoryToZip(handle, subZipFolder);
      }
    }
  };

  const _writeZipEntryToOPFS = async (zipObject, targetDirHandle) => {
    for (const relativePath of Object.keys(zipObject.files)) {
      const entry = zipObject.files[relativePath];
      if (entry.dir) continue;

      const parts = relativePath.split('/').filter(Boolean);
      const fileName = parts.pop();
      let currentDir = targetDirHandle;

      for (const part of parts) {
        currentDir = await currentDir.getDirectoryHandle(part, { create: true });
      }

      const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      const contentBlob = await entry.async('blob');
      await writable.write(contentBlob);
      await writable.close();
    }
  };

  const exportToLupisProject = async (projectId = null) => {
    opfsStore.setLoading(true);
    try {
      _ensureOPFSSupport();
      if (!projectId) throw new Error('ID Proyek tidak valid.');

      const root = await navigator.storage.getDirectory();
      let appDir, projectsDir, targetProjectDir;

      try {
        appDir = await root.getDirectoryHandle('lupis-engine');
        projectsDir = await appDir.getDirectoryHandle('projects');
        targetProjectDir = await projectsDir.getDirectoryHandle(String(projectId));
      } catch (e) {
        throw new Error(`Folder proyek '${projectId}' tidak ditemukan di OPFS.`);
      }

      let fileName = String(projectId);
      try {
        const projectJsonHandle = await targetProjectDir.getFileHandle('project.json');
        const projectJsonFile = await projectJsonHandle.getFile();
        const projectJsonText = await projectJsonFile.text();
        const projectData = JSON.parse(projectJsonText);

        if (projectData && projectData.name) {
          const sanitizedName = projectData.name
            .trim()
            .replace(/[/\\?%*:|"<>]/g, '') 
            .replace(/\s+/g, '_');         

          if (sanitizedName) {
            fileName = sanitizedName;
          }
        }
      } catch (e) {
        console.warn('Gagal membaca nama dari project.json, menggunakan ID sebagai nama file:', e);
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
        title: 'Ekspor Berhasil',
        message: `Proyek '${fileName}' berhasil disimpan sebagai .lupisproject.`,
        type: 'success'
      });

      return { success: true };
    } catch (error) {
      console.error('Gagal ekspor .lupisproject:', error);
      showPop({ title: 'Gagal Ekspor Proyek', message: error.message, type: 'error' });
      return { success: false, error: error.message };
    } finally {
      opfsStore.setLoading(false);
    }
  };

  const importFromLupisProject = async (file) => {
    opfsStore.setLoading(true);
    try {
      _ensureOPFSSupport();
      if (!file) throw new Error('File tidak ditemukan.');

      const loadedZip = await decodeLupisProject(file);

      let projectJsonFile = loadedZip.file('project.json');
      if (!projectJsonFile) {
        const projectJsonKeys = Object.keys(loadedZip.files).filter(k => k.endsWith('project.json'));
        if (projectJsonKeys.length > 0) {
          projectJsonFile = loadedZip.file(projectJsonKeys[0]);
        }
      }

      if (!projectJsonFile) {
        throw new Error('File tidak valid: "project.json" tidak ditemukan di dalam arsip proyek.');
      }

      const projectJsonText = await projectJsonFile.async('text');
      const projectData = JSON.parse(projectJsonText);

      if (!projectData.id) {
        throw new Error('Format project.json tidak valid: Missing project ID.');
      }

      const projectId = String(projectData.id);

      const root = await navigator.storage.getDirectory();
      const appDir = await root.getDirectoryHandle('lupis-engine', { create: true });
      const projectsDir = await appDir.getDirectoryHandle('projects', { create: true });
      const targetProjectDir = await projectsDir.getDirectoryHandle(projectId, { create: true });

      await _writeZipEntryToOPFS(loadedZip, targetProjectDir);

      showPop({
        title: 'Import Berhasil',
        message: `Proyek "${projectData.name || projectId}" berhasil di-import.`,
        type: 'success'
      });

      return { success: true, projectId, projectData };
    } catch (error) {
      console.error('Gagal import .lupisproject:', error);
      showPop({ title: 'Gagal Import Proyek', message: error.message, type: 'error' });
      return { success: false, error: error.message };
    } finally {
      opfsStore.setLoading(false);
    }
  };

  return {
    getUserDirectory,
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