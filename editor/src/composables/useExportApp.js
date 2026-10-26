import { ref } from 'vue';
import JSZip from 'jszip';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useProjectStore } from '@projects/projects.js';
import { usePopAlert } from '@composables/composables.js';

const isExporting = ref(false);
const exportType = ref(null);
const exportMode = ref(null);
const exportProgress = ref(0);
const exportStatus = ref('');
const exportError = ref(null);
const isExportComplete = ref(false);
const showExportModal = ref(false);
const exeDownloadUrl = ref(null);
const exeDownloadUrls = ref({
  development: null,
  release: null
});
const projectExeDownloadUrls = ref({});
const currentExportProjectId = ref(null);

const resetExportState = () => {
  isExporting.value = false;
  exportType.value = null;
  exportMode.value = null;
  exportProgress.value = 0;
  exportStatus.value = '';
  exportError.value = null;
  isExportComplete.value = false;
  showExportModal.value = false;
  exeDownloadUrl.value = null;
  exeDownloadUrls.value = {
    development: null,
    release: null
  };
  projectExeDownloadUrls.value = {};
  currentExportProjectId.value = null;
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    resetExportState();
  });
}

export function useExportApp() {
  const workspaceStore = useWorkspaceStore();
  const { showPop } = usePopAlert();

  const closeExportModal = async (projectId = null) => {
    if (isExporting.value) return;
    const targetPid = projectId || currentExportProjectId.value;
    resetExportState();

    if (targetPid) {
      try {
        const backendUrl = workspaceStore.config?.backendUrl || workspaceStore.backendBaseUrl || 'http://localhost:4000';
        fetch(`${backendUrl}/api/export-app/cache/${targetPid}`, {
          method: 'DELETE',
          signal: AbortSignal.timeout(3000)
        }).catch(() => {});
      } catch {}
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

  const _checkBackendHealth = async (baseUrl) => {
    try {
      const res = await fetch(`${baseUrl}/api/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  };

  const _uploadWithProgress = (url, formData, responseType, onProgress) => {
    return new Promise((resolve, reject) => {
      if (typeof XMLHttpRequest === 'undefined') {
        fetch(url, { method: 'POST', body: formData })
          .then(async (response) => {
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `Server error (${response.status})`);
            }
            if (responseType === 'blob') {
              const blob = await response.blob();
              resolve(blob);
            } else {
              const json = await response.json();
              resolve(json);
            }
          })
          .catch(reject);
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.responseType = responseType;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const percent = Math.round((event.loaded / event.total) * 100);
          if (typeof onProgress === 'function') {
            onProgress(percent);
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          let errorMsg = `Server error (${xhr.status})`;
          try {
            if (responseType === 'blob' && xhr.response instanceof Blob) {
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const parsed = JSON.parse(reader.result);
                  reject(new Error(parsed.error || errorMsg));
                } catch {
                  reject(new Error(errorMsg));
                }
              };
              reader.readAsText(xhr.response);
              return;
            } else if (typeof xhr.response === 'object' && xhr.response?.error) {
              errorMsg = xhr.response.error;
            } else if (typeof xhr.responseText === 'string' && xhr.responseText) {
              const parsed = JSON.parse(xhr.responseText);
              errorMsg = parsed.error || errorMsg;
            }
          } catch {}
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload to export service.'));
      xhr.ontimeout = () => reject(new Error('Upload to export service timed out.'));
      xhr.send(formData);
    });
  };

  const checkProjectExeBuilds = async (projectId) => {
    if (!projectId) return;
    try {
      const backendUrl = workspaceStore.config?.backendUrl || workspaceStore.backendBaseUrl || 'http://localhost:4000';
      const isHealthy = await _checkBackendHealth(backendUrl);
      if (!isHealthy) return;

      const res = await fetch(`${backendUrl}/api/export-app/status/${projectId}`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.builds) {
          projectExeDownloadUrls.value[projectId] = {
            development: data.builds.development ? `${backendUrl}${data.builds.development}` : null,
            release: data.builds.release ? `${backendUrl}${data.builds.release}` : null
          };
        }
      }
    } catch {}
  };

  const downloadExeFile = (projectId, mode = null, customProjectName = null) => {
    let targetUrl = null;
    const projectUrls = projectId ? projectExeDownloadUrls.value[projectId] : null;
    if (projectUrls && mode && projectUrls[mode]) {
      targetUrl = projectUrls[mode];
    } else if (projectUrls && !mode) {
      targetUrl = projectUrls.release || projectUrls.development;
    } else if (mode && exeDownloadUrls.value?.[mode]) {
      targetUrl = exeDownloadUrls.value[mode];
    } else {
      targetUrl = exeDownloadUrl.value;
    }

    if (!targetUrl) return;

    let targetHref = targetUrl;

    let effectiveName = customProjectName;
    if (!effectiveName) {
      try {
        const projectStore = useProjectStore();
        effectiveName = projectStore?.projectName || projectStore?.project?.name;
      } catch {}
    }
    const safeName = (effectiveName || projectId || 'game').trim().replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_') || 'game';

    if (!targetHref.includes('&name=') && !targetHref.includes('?name=')) {
      const sep = targetHref.includes('?') ? '&' : '?';
      targetHref = `${targetHref}${sep}name=${encodeURIComponent(safeName)}`;
    }

    if (window.electronAPI && window.electronAPI.openExternal) {
      window.electronAPI.openExternal(targetHref);
      return;
    }

    const suffix = mode === 'development' ? '_Development' : (mode === 'release' ? '_Release' : '');
    const link = document.createElement('a');
    link.href = targetHref;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('download', `${safeName}${suffix}.exe`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) link.parentNode.removeChild(link);
    }, 200);
  };

  const exportApp = async (projectId, format = 'exe', mode = 'release') => {
    if (!projectId) {
      showPop({
        title: 'Export Failed',
        message: 'Project ID is invalid or missing.',
        type: 'error'
      });
      return { success: false };
    }

    currentExportProjectId.value = projectId;

    const targetFormat = format.toLowerCase() === 'zip' ? 'zip' : 'exe';
    const targetMode = mode === 'development' ? 'development' : 'release';
    const modeLabel = targetMode === 'development' ? 'Development' : 'Release';

    isExporting.value = true;
    showExportModal.value = true;
    exportType.value = targetFormat;
    exportMode.value = targetMode;
    exportProgress.value = 5;
    exportStatus.value = 'Connecting to export backend service...';
    exportError.value = null;
    isExportComplete.value = false;

    let serverPollTimer = null;

    try {
      const backendUrl = workspaceStore.config?.backendUrl || workspaceStore.backendBaseUrl || 'http://localhost:4000';

      const isHealthy = await _checkBackendHealth(backendUrl);
      if (!isHealthy) {
        throw new Error('Export backend service is not ready. Please wait a few seconds and try again.');
      }

      exportProgress.value = 15;
      exportStatus.value = 'Reading project files from storage...';

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

      // 1. Extract name and updatedAt from projectStore and OPFS project.json
      let projectName = projectId;
      let updatedAt = new Date().toISOString();

      try {
        const projectStore = useProjectStore();
        if (projectStore?.projectName) {
          projectName = projectStore.projectName;
        }
      } catch {}

      try {
        const projectFileHandle = await targetProjectDir.getFileHandle('project.json');
        const projectFile = await projectFileHandle.getFile();
        const projectText = await projectFile.text();
        const projectJson = JSON.parse(projectText);
        if (projectJson.updatedAt) {
          updatedAt = projectJson.updatedAt;
        }
        if (projectJson.name) {
          projectName = projectJson.name;
        }
      } catch (err) {
        console.warn('Failed to read project.json from OPFS, using fallback timestamp.', err);
      }

      projectName = projectName.trim().replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_') || projectId;

      // 2. Compress OPFS folder with JSZip
      exportProgress.value = 20;
      exportStatus.value = 'Compressing project archive (0%)...';
      const projectZip = new JSZip();
      await _addDirectoryToZip(targetProjectDir, projectZip);
      const projectBlob = await projectZip.generateAsync(
        { type: 'blob' },
        (metadata) => {
          if (metadata && typeof metadata.percent === 'number') {
            const mapped = Math.round(20 + (metadata.percent * 0.25));
            exportProgress.value = Math.min(mapped, 45);
            exportStatus.value = `Compressing project archive (${Math.round(metadata.percent)}%)...`;
          }
        }
      );

      // 3. Prepare unified FormData
      const formData = new FormData();
      formData.append('projectZip', projectBlob, `${projectId}.zip`);
      formData.append('projectId', projectId);
      formData.append('projectName', projectName);
      formData.append('updatedAt', updatedAt);
      formData.append('mode', targetMode);

      exportProgress.value = 45;
      exportStatus.value = 'Uploading project package to server (0%)...';

      const onUploadProgress = (uploadPercent) => {
        const mapped = Math.round(45 + (uploadPercent * 0.35));
        exportProgress.value = Math.min(mapped, 80);
        exportStatus.value = `Uploading project package to server (${uploadPercent}%)...`;
      };

      // 4. Handle ZIP format
      if (targetFormat === 'zip') {
        const uploadUrl = `${backendUrl}/api/export-app/zip`;
        const resultPromise = _uploadWithProgress(uploadUrl, formData, 'blob', onUploadProgress);

        serverPollTimer = setInterval(() => {
          if (exportProgress.value >= 80 && exportProgress.value < 95) {
            exportProgress.value += 1;
            exportStatus.value = 'Building standalone web package on server...';
          }
        }, 500);

        const resultBlob = await resultPromise;
        if (serverPollTimer) clearInterval(serverPollTimer);

        exportProgress.value = 100;
        exportStatus.value = 'Web Standalone export completed!';
        isExportComplete.value = true;

        const downloadUrl = URL.createObjectURL(resultBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${projectName}_${modeLabel}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        showPop({
          title: `Export ${modeLabel} Successful`,
          message: `Standalone Web (${modeLabel}) (.zip) for project "${projectName}" downloaded successfully!`,
          type: 'success'
        });

        return { success: true, mode: targetMode };
      }

      // 5. Handle EXE format
      const uploadUrl = `${backendUrl}/api/export-app/exe`;
      const resultPromise = _uploadWithProgress(uploadUrl, formData, 'json', onUploadProgress);

      serverPollTimer = setInterval(() => {
        if (exportProgress.value >= 80 && exportProgress.value < 95) {
          exportProgress.value += 1;
          exportStatus.value = 'Compiling Windows desktop executable on server...';
        }
      }, 500);

      const resData = await resultPromise;
      if (serverPollTimer) clearInterval(serverPollTimer);

      if (!resData || !resData.success) {
        throw new Error(resData?.error || 'Failed to compile Windows executable');
      }

      exportProgress.value = 100;
      exportStatus.value = 'Desktop executable compiled successfully!';
      isExportComplete.value = true;

      const fullExeUrl = `${backendUrl}${resData.downloadUrl}`;
      exeDownloadUrl.value = fullExeUrl;
      exeDownloadUrls.value[targetMode] = fullExeUrl;

      if (!projectExeDownloadUrls.value[projectId]) {
        projectExeDownloadUrls.value[projectId] = {
          development: null,
          release: null
        };
      }
      projectExeDownloadUrls.value[projectId][targetMode] = fullExeUrl;

      showPop({
        title: `EXE (${modeLabel}) Build Complete!`,
        message: `Standalone executable (${modeLabel} .EXE) for "${projectName}" is ready! Click 'Download ${modeLabel} (.EXE)' to download.`,
        type: 'success'
      });

      return { success: true, mode: targetMode };

    } catch (error) {
      if (serverPollTimer) clearInterval(serverPollTimer);
      console.error(`[ExportApp ${targetFormat.toUpperCase()} (${targetMode}) Error]:`, error);
      exportError.value = error.message || 'An error occurred while exporting project.';
      exportStatus.value = 'Export failed';
      isExportComplete.value = false;

      showPop({
        title: 'Application Export Failed',
        message: error.message || 'An error occurred while exporting project.',
        type: 'error'
      });
      return { success: false, error: error.message };
    } finally {
      if (serverPollTimer) clearInterval(serverPollTimer);
      isExporting.value = false;
    }
  };

  return {
    isExporting,
    exportType,
    exportMode,
    exportProgress,
    exportStatus,
    exportError,
    isExportComplete,
    showExportModal,
    closeExportModal,
    resetExportState,
    exeDownloadUrl,
    exeDownloadUrls,
    projectExeDownloadUrls,
    checkProjectExeBuilds,
    exportApp,
    downloadExeFile
  };
}
