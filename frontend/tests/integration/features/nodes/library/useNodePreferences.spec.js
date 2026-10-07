import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// 1. Mock dependencies eksternal & composable terkait
vi.mock('@nodes/nodes.js', () => ({
  useNodeBlueprint: vi.fn(() => ({
    nodeGroups: [
      {
        id: 'math',
        label: 'Math',
        items: [
          { type: 'math_add', label: 'Add Node' },
          { type: 'math_sub', label: 'Subtract Node' }
        ]
      },
      {
        id: 'string',
        label: 'String',
        items: [
          { type: 'string_concat', label: 'Concat Node' }
        ]
      }
    ]
  }))
}));

// Import composables dan modul yang diuji setelah mock
import { useNodePreferences } from '@nodes/library/composables/useNodePreferences.js';
import { useProjectStore } from '@projects/projects.js';
import { 
  setupMockOPFS, 
  createMockEmptyProject 
} from '@tests/tests.js';

describe('useNodePreferences Integration', () => {
  let pinia;
  let projectStore;
  let mockStoreRef;

  beforeEach(async () => {
    pinia = createPinia();
    setActivePinia(pinia);

    // Persiapan mock environment
    mockStoreRef = setupMockOPFS();
    projectStore = useProjectStore();
    const mockProject = await createMockEmptyProject({ projectName: 'Preferences Test Project' });
    projectStore.project = mockProject;

    // Reset state localStorage & state internal composable
    localStorage.clear();
    const { toggleFavorite, recentNodes, favoriteNodes } = useNodePreferences();
    
    // Pembersihan state reaktif jika ada sisa dari tes sebelumnya
    favoriteNodes.value.forEach(node => toggleFavorite(node));
    recentNodes.value.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    if (mockStoreRef?.store) {
      mockStoreRef.store.clear();
    }
  });

  describe('Favorite Nodes Management', () => {
    it('toggles node favorite status and updates localStorage correctly', () => {
      // Arrange
      const { toggleFavorite, isFavorite, favoriteNodes } = useNodePreferences();
      const targetNode = { type: 'math_add', label: 'Add Node' };

      // Act 1: Tambahkan ke favorit
      toggleFavorite(targetNode);

      // Assert 1
      expect(isFavorite(targetNode)).toBe(true);
      expect(favoriteNodes.value).toHaveLength(1);
      expect(favoriteNodes.value[0]).toEqual(targetNode);
      expect(JSON.parse(localStorage.getItem('lupis-fav-nodes'))).toContain('math_add');

      // Act 2: Hapus dari favorit (toggle kembali)
      toggleFavorite('math_add');

      // Assert 2
      expect(isFavorite('math_add')).toBe(false);
      expect(favoriteNodes.value).toHaveLength(0);
      expect(JSON.parse(localStorage.getItem('lupis-fav-nodes'))).not.toContain('math_add');
    });

    it('filters out invalid or unregistered node ids when mapping favoriteNodes', () => {
      // Arrange
      const { toggleFavorite, favoriteNodes } = useNodePreferences();

      // Act: Tambahkan tipe node terdaftar dan tipe node fiktif
      toggleFavorite('math_sub');
      toggleFavorite('non_existent_node_type');

      // Assert: Hanya node terdaftar di nodeGroups yang dirender ke favoriteNodes
      expect(favoriteNodes.value).toHaveLength(1);
      expect(favoriteNodes.value[0].type).toBe('math_sub');
    });
  });

  describe('Recent Nodes Management', () => {
    it('adds node type to recent list, places it at top, and avoids duplicates', () => {
      // Arrange
      const { addToRecent, recentNodes } = useNodePreferences();

      // Act
      addToRecent('math_add');
      addToRecent('string_concat');
      addToRecent('math_add'); // Tambahkan ulang untuk menguji pergeseran posisi ke paling depan

      // Assert
      expect(recentNodes.value).toHaveLength(2);
      expect(recentNodes.value[0].type).toBe('math_add');
      expect(recentNodes.value[1].type).toBe('string_concat');
      
      const storedRecents = JSON.parse(localStorage.getItem('lupis-recent-nodes'));
      expect(storedRecents[0]).toBe('math_add');
    });

    it('limits recent nodes history to maximum 15 items', () => {
      // Arrange
      const { addToRecent } = useNodePreferences();

      // Act: Tambahkan 18 node berurutan
      for (let i = 1; i <= 18; i++) {
        addToRecent(`type_${i}`);
      }

      // Assert: Jumlah riwayat di-cap maksimal 15
      const storedRecents = JSON.parse(localStorage.getItem('lupis-recent-nodes'));
      expect(storedRecents).toHaveLength(15);
      expect(storedRecents[0]).toBe('type_18');
      expect(storedRecents).not.toContain('type_1');
      expect(storedRecents).not.toContain('type_2');
      expect(storedRecents).not.toContain('type_3');
    });
  });

  describe('Negative & Edge Cases', () => {
    it('[Bad Path] handles localStorage reading error gracefully when JSON payload is corrupted', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('lupis-fav-nodes', 'invalid_json_{{');

      // Act & Assert
      expect(() => {
        const { favoriteNodes } = useNodePreferences();
        expect(favoriteNodes.value).toBeDefined();
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('[Bad Path] handles non-existent node type check gracefully in isFavorite', () => {
      // Arrange
      const { isFavorite } = useNodePreferences();

      // Act & Assert
      expect(isFavorite('non_existent_type')).toBe(false);
      expect(isFavorite({ type: 'unknown_type' })).toBe(false);
    });
  });
});