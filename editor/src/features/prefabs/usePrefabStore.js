import { defineStore } from 'pinia';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useOPFSActions } from '@opfs/opfs.js';

export const usePrefabStore = defineStore('prefab', {
  state: () => ({
    prefabs: []
  }),

  getters: {
    getAllPrefabs: (state) => {
      return state.prefabs.map(p => ({
        id: p.id,
        name: p.name,
        folderId: p.folderId,
        thumbnailUrl: null, 
        originalData: p
      }));
    },
    
    getPrefabById: (state) => (id) => {
      return state.prefabs.find(p => p.id === id);
    }
  },

  actions: {
    initPrefabs(prefabList) {
      this.prefabs = prefabList.map(p => ({
        ...p,
        folderId: p.folderId
      }));
    },

    /**
     * DOMAIN LOGIC: Menentukan struktur path OPFS spesifik Prefab & Workspaces
     */
    async _getPrefabDirectories() {
      const workspaceStore = useWorkspaceStore();
      const opfs = useOPFSActions();
      
      const projectId = String(workspaceStore.activeProjectId);

      const projectsRootDir = await opfs.getProjectsRootDirectory();

      const prefabsDir = await opfs.resolveDirectoryPath(projectsRootDir, `${projectId}/prefabs`);
      const workspacesDir = await opfs.resolveDirectoryPath(projectsRootDir, `${projectId}/workspaces`);

      return { prefabsDir, workspacesDir };
    },

    /**
     * Menyinkronkan metadata prefabs.json ke OPFS
     */
    async syncPrefabsMetaToOPFS() {
      const workspaceStore = useWorkspaceStore();
      const opfs = useOPFSActions();
      const { workspacesDir } = await this._getPrefabDirectories();

      const projectId = workspaceStore.activeProjectId;
      const prefabMetas = this.prefabs.map(p => ({
        id: p.id,
        projectId: projectId,
        folderId: p.folderId,
        name: p.name,
        type: p.type
      }));

      const jsonContent = JSON.stringify(prefabMetas, null, 2);
      await opfs.writeFileToHandle(workspacesDir, 'prefabs.json', jsonContent);
    },

    /**
     * Menyimpan single file prefab data ({id}.json) dan metadata
     */
    async savePrefabToOPFS(prefab) {
      const opfs = useOPFSActions();
      const { prefabsDir } = await this._getPrefabDirectories();

      const cleanPrefab = JSON.parse(JSON.stringify(prefab));
      delete cleanPrefab.projectId;
      delete cleanPrefab.folderId;

      const fileName = `${prefab.id}.json`;
      const jsonContent = JSON.stringify(cleanPrefab, null, 2);

      await opfs.writeFileToHandle(prefabsDir, fileName, jsonContent);
      await this.syncPrefabsMetaToOPFS();
    },

    async addPrefab(prefab) {
      this.prefabs.push(prefab);
      await this.savePrefabToOPFS(prefab);
    },

    async movePrefab(prefabId, targetFolderId) {
      const prefab = this.prefabs.find(p => p.id === prefabId);
      if (prefab) {
        prefab.folderId = targetFolderId;
        await this.syncPrefabsMetaToOPFS();
      }
      return true;
    },

    async updatePrefab(id, updates) {
      const index = this.prefabs.findIndex(p => p.id === id);
      if (index !== -1) {
        this.prefabs[index] = { ...this.prefabs[index], ...updates };
        await this.savePrefabToOPFS(this.prefabs[index]);
      }
    },

    async removePrefab(id) {
      const prefab = this.getPrefabById(id);
      if (!prefab) return;

      const opfs = useOPFSActions();
      const { prefabsDir } = await this._getPrefabDirectories();

      await opfs.removeFileFromHandle(prefabsDir, `${id}.json`);

      this.prefabs = this.prefabs.filter(p => p.id !== id);
      await this.syncPrefabsMetaToOPFS();
    },

    updateComponentProp(prefabId, compName, propName, value) {
      const prefab = this.prefabs.find(p => p.id === prefabId);
      if (prefab && prefab.data?.components?.[compName]) {
        prefab.data.components[compName][propName] = value;
      }
    }
  }
});