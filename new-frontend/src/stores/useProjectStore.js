import { defineStore } from 'pinia';

export const useProjectStore = defineStore('project', {
  // -------------------------------------------------------------------------
  // STATE: Single Source of Truth untuk Konfigurasi Global
  // -------------------------------------------------------------------------
  state: () => ({
    // 1. Identitas Project
    project: {
      id: null,
      name: 'Untitled Project',
      ownerId: null, // User yang sedang login
      created_at: null,
    },

    // 2. Global Config (Settingan Canvas & Engine)
    settings: {
      width: 1280, 
      height: 720,
      backgroundColor: '#222222',
      pixelArt: true, // Hint untuk engine (Nearest vs Linear filter)
    },

    // 3. Layer Definitions (Rak Penyimpanan)
    // Default layers sebelum data dilaod
    layers: [
      { id: 'layer_root', name: 'Background', order: 0, visible: true, locked: true },
      { id: 'layer_objects', name: 'Main Objects', order: 1, visible: true, locked: false },
    ],

    // 4. Scene Manifest (Daftar Isi Level)
    // Hanya daftar nama & ID, bukan isi entitasnya
    scenes: [],

    // 5. Pointer Scene yang sedang dibuka
    activeSceneId: null,

    // UI State
    isLoading: false,
    isSaving: false,
  }),

  // -------------------------------------------------------------------------
  // GETTERS: Computed properties untuk UI
  // -------------------------------------------------------------------------
  getters: {
    // Contoh: Rasio aspek untuk container CSS canvas
    aspectRatio: (state) => state.settings.width / state.settings.height,
    
    // Mengambil nama scene aktif untuk ditampilkan di Header
    currentSceneName: (state) => {
      const scene = state.scenes.find(s => s.id === state.activeSceneId);
      return scene ? scene.name : 'No Scene Selected';
    }
  },

  // -------------------------------------------------------------------------
  // ACTIONS: Logika perubahan data
  // -------------------------------------------------------------------------
  actions: {
    /**
     * @param {string} userId - ID Pengguna dari Auth Login
     * @param {string} projectId - ID Project yang dipilih
     */
    async loadProject(userId, projectId) {
      this.isLoading = true;
      console.log(`🔄 [ProjectStore] Loading project: ${projectId} for user: ${userId}...`);

      // --- SIMULASI API FETCH (Ganti dengan axios nanti) ---
      await new Promise(resolve => setTimeout(resolve, 800)); // Fake delay

      // DUMMY DATA: Sesuai Seeder "Dungeon Project"
      this.project = {
        id: projectId || 'project_dungeon_demo_01',
        name: 'Dungeon Project',
        ownerId: userId || 'dev_2025',
        created_at: new Date().toISOString(),
      };

      this.settings = {
        width: 1280,
        height: 720,
        backgroundColor: '#222222',
        pixelArt: true
      };

      // Load Layers sesuai seeder Project.js
      this.layers = [
        { id: 'layer_root', name: 'Root Layer', order: 0, visible: true, locked: true },
        { id: 'layer_hero', name: 'Hero Layer', order: 1, visible: true, locked: false }
      ];

      // Load Daftar Scene (Nanti fetch dari endpoint /scenes?projectId=...)
      this.scenes = [
        { id: 'scene_level_1_demo', name: 'Level 1' },
        { id: 'scene_level_2', name: 'Boss Room' } // Tambahan contoh
      ];

      // Otomatis buka scene pertama jika ada
      if (this.scenes.length > 0 && !this.activeSceneId) {
        this.activeSceneId = this.scenes[0].id;
      }

      this.isLoading = false;
      console.log('✅ [ProjectStore] Loaded:', this.project.name);
    },

    // --- Scene Management ---
    
    setActiveScene(sceneId) {
      if (this.activeSceneId === sceneId) return;
      
      const target = this.scenes.find(s => s.id === sceneId);
      if (target) {
        this.activeSceneId = sceneId;
        console.log(`👉 [ProjectStore] Active scene changed to: ${target.name}`);
        // NOTE: Di komponen nanti, watcher akan mendeteksi perubahan activeSceneId
        // dan memicu useSceneStore.loadScene(sceneId)
      }
    },

    addScene(name) {
      const newId = `scene_${Date.now()}`;
      this.scenes.push({ id: newId, name });
      this.setActiveScene(newId);
    },

    // --- Layer Management ---

    addLayer(name) {
      const newId = `layer_${Date.now()}`;
      this.layers.push({
        id: newId,
        name: name,
        order: this.layers.length, // Taruh paling atas
        visible: true,
        locked: false
      });
      // NOTE: Jangan lupa nanti panggil GameService.updateLayers() di watcher
    },

    reorderLayers(newLayerList) {
      // Update order index berdasarkan urutan array baru
      this.layers = newLayerList.map((l, idx) => ({ ...l, order: idx }));
    }
  }
});