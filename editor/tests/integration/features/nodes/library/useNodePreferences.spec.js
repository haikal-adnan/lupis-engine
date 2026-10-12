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

import { useProjectStore } from '@projects/projects.js';
import { 
  setupMockOPFS, 
  createMockEmptyProject 
} from '@tests/tests.js';

describe('useNodePreferences Integration', () => {
  let pinia;
  let projectStore;
  let mockStoreRef;
  let useNodePreferences;

  beforeEach(async () => {
    // Reset registry modul agar singleton state 'recentNodesIds' dibuat ulang
    vi.resetModules();
    localStorage.clear();

    pinia = createPinia();
    setActivePinia(pinia);

    // Persiapan mock environment
    mockStoreRef = setupMockOPFS();
    projectStore = useProjectStore();
    const mockProject = await createMockEmptyProject({ projectName: 'Preferences Test Project' });
    projectStore.project = mockProject;

    // Import composable secara dinamis setelah cache modul & localStorage dibersihkan
    const preferenceModule = await import('@nodes/library/composables/useNodePreferences.js');
    useNodePreferences = preferenceModule.useNodePreferences;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    if (mockStoreRef?.store) {
      mockStoreRef.store.clear();
    }
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

    it('accepts node object as parameter and handles resolution correctly', () => {
      // Arrange
      const { addToRecent, recentNodes } = useNodePreferences();
      const targetNode = { type: 'math_sub', label: 'Subtract Node' };

      // Act
      addToRecent(targetNode);

      // Assert
      expect(recentNodes.value).toHaveLength(1);
      expect(recentNodes.value[0].type).toBe('math_sub');
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

    it('filters out unregistered node types from recentNodes computed list', () => {
      // Arrange
      const { addToRecent, recentNodes } = useNodePreferences();

      // Act
      addToRecent('math_add');
      addToRecent('unregistered_type');

      // Assert: Object di mapped list hanya berisi node yang valid di blueprint
      expect(recentNodes.value).toHaveLength(1);
      expect(recentNodes.value[0].type).toBe('math_add');
      
      // Namun ID mentah tetap tersimpan di localStorage
      const storedRecents = JSON.parse(localStorage.getItem('lupis-recent-nodes'));
      expect(storedRecents).toContain('unregistered_type');
    });
  });

  describe('Negative & Edge Cases', () => {
    it('[Bad Path] handles localStorage reading error gracefully when JSON payload is corrupted', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('lupis-recent-nodes', 'invalid_json_{{');

      // Reset & re-import agar getStorageItem mengeksekusi JSON.parse pada payload yang korup
      vi.resetModules();
      const { useNodePreferences: freshUseNodePreferences } = await import('@nodes/library/composables/useNodePreferences.js');

      // Act & Assert
      expect(() => {
        const { recentNodes } = freshUseNodePreferences();
        expect(recentNodes.value).toBeDefined();
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('[Bad Path] ignores invalid input types gracefully in addToRecent', () => {
      // Arrange
      const { addToRecent, recentNodes } = useNodePreferences();

      // Act
      addToRecent(null);
      addToRecent(undefined);
      addToRecent({});

      // Assert
      expect(recentNodes.value).toHaveLength(0);
    });
  });
});