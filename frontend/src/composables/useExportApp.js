import { ref } from 'vue';
import JSZip from 'jszip';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { usePopAlert } from '@composables/composables.js';

export function useExportApp() {
  const workspaceStore = useWorkspaceStore();
  const { showPop } = usePopAlert();
  const isExporting = ref(false);
  const exportType = ref(null); 
  const exeDownloadUrl = ref(null);

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

  const _checkBackendHealth = async (baseUrl) => {
    try {
      const res = await fetch(`${baseUrl}/api/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  };

  const downloadExeFile = (projectId) => {
    if (!exeDownloadUrl.value) return;

    if (window.electronAPI && window.electronAPI.openExternal) {
      window.electronAPI.openExternal(exeDownloadUrl.value);
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = exeDownloadUrl.value;
    document.body.appendChild(iframe);

    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 60000);
  };

  const exportApp = async (projectId, format = 'exe') => {
    if (!projectId) {
      showPop({
        title: 'Ekspor Gagal',
        message: 'ID Proyek tidak valid atau tidak ditemukan.',
        type: 'error'
      });
      return { success: false };
    }

    const targetFormat = format.toLowerCase() === 'zip' ? 'zip' : 'exe';
    isExporting.value = true;
    exportType.value = targetFormat;

    try {
      const backendUrl = workspaceStore.backendBaseUrl || 'http://localhost:4000';

      const isHealthy = await _checkBackendHealth(backendUrl);
      if (!isHealthy) {
        throw new Error('Layanan backend ekspor belum siap. Harap tunggu beberapa detik dan coba lagi.');
      }

      if (!navigator.storage || !navigator.storage.getDirectory) {
        throw new Error('Browser Anda tidak mendukung OPFS.');
      }

      const root = await navigator.storage.getDirectory();
      let targetProjectDir;
      try {
        const appDir = await root.getDirectoryHandle('lupis-engine');
        const projectsDir = await appDir.getDirectoryHandle('projects');
        targetProjectDir = await projectsDir.getDirectoryHandle(String(projectId));
      } catch (fsErr) {
        throw new Error(`Folder proyek '${projectId}' tidak ditemukan di penyimpanan lokal (OPFS).`);
      }

      // 1. Ekstraksi updatedAt dari project.json OPFS (digunakan oleh ZIP dan EXE)
      let updatedAt = new Date().toISOString();
      try {
        const projectFileHandle = await targetProjectDir.getFileHandle('project.json');
        const projectFile = await projectFileHandle.getFile();
        const projectText = await projectFile.text();
        const projectJson = JSON.parse(projectText);
        if (projectJson.updatedAt) {
          updatedAt = projectJson.updatedAt;
        }
      } catch (err) {
        console.warn('Gagal membaca project.json dari OPFS, menggunakan timestamp fallback.', err);
      }

      // 2. Kompresi folder OPFS ke JSZip
      const projectZip = new JSZip();
      await _addDirectoryToZip(targetProjectDir, projectZip);
      const projectBlob = await projectZip.generateAsync({ type: 'blob' });

      // 3. Menyiapkan FormData terpadu
      const formData = new FormData();
      formData.append('projectZip', projectBlob, `${projectId}.zip`);
      formData.append('projectId', projectId);
      formData.append('updatedAt', updatedAt); // Sekarang terkirim baik di ZIP maupun EXE

      // 4. Handling untuk format ZIP
      if (targetFormat === 'zip') {
        const response = await fetch(`${backendUrl}/api/export-app/zip`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error (${response.status})`);
        }

        const resultBlob = await response.blob();
        const downloadUrl = URL.createObjectURL(resultBlob);

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${projectId}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        showPop({
          title: 'Ekspor Berhasil',
          message: `Aplikasi Web Standalone (.zip) untuk proyek '${projectId}' berhasil diunduh.`,
          type: 'success'
        });

        return { success: true };
      }

      // 5. Handling untuk format EXE
      const response = await fetch(`${backendUrl}/api/export-app/exe`, {
        method: 'POST',
        body: formData,
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || `Server error (${response.status})`);
      }

      exeDownloadUrl.value = `${backendUrl}${resData.downloadUrl}`;

      showPop({
        title: 'Build EXE Selesai!',
        message: `Kompilasi aplikasi '${projectId}' berhasil! Silakan klik tombol 'Download (.EXE)' untuk mengunduh.`,
        type: 'success'
      });

      return { success: true };

    } catch (error) {
      console.error(`[ExportApp ${targetFormat.toUpperCase()} Error]:`, error);
      showPop({
        title: 'Gagal Ekspor Aplikasi',
        message: error.message || 'Terjadi kesalahan saat mengekspor proyek.',
        type: 'error'
      });
      return { success: false, error: error.message };
    } finally {
      isExporting.value = false;
      exportType.value = null;
    }
  };

  return {
    isExporting,
    exportType,
    exeDownloadUrl,
    exportApp,
    downloadExeFile
  };
}