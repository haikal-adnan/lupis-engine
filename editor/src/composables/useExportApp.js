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

    const link = document.createElement('a');
    link.href = exeDownloadUrl.value;
    link.setAttribute('download', `${projectId || 'game'}.exe`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportApp = async (projectId, format = 'exe') => {
    if (!projectId) {
      showPop({
        title: 'Export Failed',
        message: 'Project ID is invalid or missing.',
        type: 'error'
      });
      return { success: false };
    }

    const targetFormat = format.toLowerCase() === 'zip' ? 'zip' : 'exe';
    isExporting.value = true;
    exportType.value = targetFormat;

    try {
      const backendUrl = workspaceStore.config?.backendUrl || workspaceStore.backendBaseUrl || 'http://localhost:4000';

      const isHealthy = await _checkBackendHealth(backendUrl);
      if (!isHealthy) {
        throw new Error('Export backend service is not ready. Please wait a few seconds and try again.');
      }

      if (!navigator.storage || !navigator.storage.getDirectory) {
        throw new Error('Your browser does not support OPFS.');
      }

      const root = await navigator.storage.getDirectory();
      let targetProjectDir;
      try {
        const appDir = await root.getDirectoryHandle('lupis-engine');
        const projectsDir = await appDir.getDirectoryHandle('projects');
        targetProjectDir = await projectsDir.getDirectoryHandle(String(projectId));
      } catch (fsErr) {
        throw new Error(`Project folder '${projectId}' not found in local storage (OPFS).`);
      }

      // 1. Extract name and updatedAt from OPFS project.json
      let projectName = projectId;
      let updatedAt = new Date().toISOString();
      try {
        const projectFileHandle = await targetProjectDir.getFileHandle('project.json');
        const projectFile = await projectFileHandle.getFile();
        const projectText = await projectFile.text();
        const projectJson = JSON.parse(projectText);
        if (projectJson.updatedAt) {
          updatedAt = projectJson.updatedAt;
        }
        if (projectJson.name) {
          projectName = projectJson.name.trim().replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_') || projectId;
        }
      } catch (err) {
        console.warn('Failed to read project.json from OPFS, using fallback timestamp.', err);
      }

      // 2. Compress OPFS folder with JSZip
      const projectZip = new JSZip();
      await _addDirectoryToZip(targetProjectDir, projectZip);
      const projectBlob = await projectZip.generateAsync({ type: 'blob' });

      // 3. Prepare unified FormData
      const formData = new FormData();
      formData.append('projectZip', projectBlob, `${projectId}.zip`);
      formData.append('projectId', projectId);
      formData.append('projectName', projectName);
      formData.append('updatedAt', updatedAt);

      // 4. Handle ZIP format
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
        link.download = `${projectName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        showPop({
          title: 'Export Successful',
          message: `Standalone Web Application (.zip) for project "${projectName}" downloaded successfully! Ready to run with index.html.`,
          type: 'success'
        });

        return { success: true };
      }

      // 5. Handle EXE format
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
        title: 'EXE Build Complete!',
        message: `Standalone executable (.EXE) for "${projectName}" is ready! Click 'Download (.EXE)' to download.`,
        type: 'success'
      });

      return { success: true };

    } catch (error) {
      console.error(`[ExportApp ${targetFormat.toUpperCase()} Error]:`, error);
      showPop({
        title: 'Application Export Failed',
        message: error.message || 'An error occurred while exporting project.',
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
