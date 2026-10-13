import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { Boxes } from 'lucide-vue-next';

// Import langsung seluruh 28 Blueprint bawaan proyek
import { BlueprintLifecycle } from '@nodes/library/blueprints/BlueprintLifecycle.js';
import { BlueprintKeyboard } from '@nodes/library/blueprints/BlueprintKeyboard.js';
import { BlueprintTransform } from '@nodes/library/blueprints/BlueprintTransform.js';
import { BlueprintMath } from '@nodes/library/blueprints/BlueprintMath.js';
import { BlueprintSystem } from '@nodes/library/blueprints/BlueprintSystem.js';
import { BlueprintString } from '@nodes/library/blueprints/BlueprintString.js';
import { BlueprintObject } from '@nodes/library/blueprints/BlueprintObject.js';
import { BlueprintBoolean } from '@nodes/library/blueprints/BlueprintBoolean.js';
import { BlueprintComparison } from '@nodes/library/blueprints/BlueprintComparison.js';
import { BlueprintPointer } from '@nodes/library/blueprints/BlueprintPointer.js';
import { BlueprintCamera } from '@nodes/library/blueprints/BlueprintCamera.js';
import { BlueprintCollider } from '@nodes/library/blueprints/BlueprintCollider.js';
import { BlueprintPhysics } from '@nodes/library/blueprints/BlueprintPhysics.js';
import { BlueprintRenderer } from '@nodes/library/blueprints/BlueprintRenderer.js';
import { BlueprintLayer } from '@nodes/library/blueprints/BlueprintLayer.js';
import { BlueprintScene } from '@nodes/library/blueprints/BlueprintScene.js';
import { BlueprintMouse } from '@nodes/library/blueprints/BlueprintMouse.js';
import { BlueprintAnimator } from '@nodes/library/blueprints/BlueprintAnimator.js';
import { BlueprintTransition } from '@nodes/library/blueprints/BlueprintTransition.js';
import { BlueprintEvent } from '@nodes/library/blueprints/BlueprintEvent.js';
import { BlueprintCollectionHelper } from '@nodes/library/blueprints/BlueprintCollectionHelper.js';
import { BlueprintList } from '@nodes/library/blueprints/BlueprintList.js';
import { BlueprintMap } from '@nodes/library/blueprints/BlueprintMap.js';
import { BlueprintLoop } from '@nodes/library/blueprints/BlueprintLoop.js';
import { BlueprintHelper } from '@nodes/library/blueprints/BlueprintHelper.js';
import { BlueprintEntity } from '@nodes/library/blueprints/BlueprintEntity.js';
import { BlueprintRandom } from '@nodes/library/blueprints/BlueprintRandom.js';
import { BlueprintVariable } from '@nodes/library/blueprints/BlueprintVariable.js';

// Mock dependencies eksternal
vi.mock('@nodes/nodes.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNodeBlueprint: vi.fn(() => ({
      syncDynamicInputsAndCode: vi.fn()
    }))
  };
});

vi.mock('@composables/composables.js', () => ({
  usePopAlert: vi.fn(() => ({
    showPop: vi.fn()
  }))
}));

// Import modul composables dan store
import { useNodeBlueprint } from '@nodes/library/composables/useNodeBlueprint.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useProjectStore } from '@projects/projects.js';
import { 
  setupMockOPFS, 
  createMockEmptyProject 
} from '@tests/tests.js';

const allBlueprints = [
  BlueprintRandom, BlueprintEntity, BlueprintLoop, BlueprintHelper,
  BlueprintList, BlueprintMap, BlueprintCollectionHelper, BlueprintRenderer,
  BlueprintLifecycle, BlueprintBoolean, BlueprintComparison, BlueprintKeyboard,
  BlueprintPointer, BlueprintTransform, BlueprintMath, BlueprintSystem,
  BlueprintString, BlueprintObject, BlueprintCamera, BlueprintCollider,
  BlueprintPhysics, BlueprintLayer, BlueprintScene, BlueprintMouse,
  BlueprintAnimator, BlueprintTransition, BlueprintEvent, BlueprintVariable
];

// Mock Template Blueprint sesuai Standar Baru Lupis Engine
const mockCategoryTemplate = {
  id: 'category_template',
  label: 'Category Name',
  color: '#3B82F6',
  icon: Boxes,

  items: [
    {
      type: 'event_example_node',
      label: 'On Custom Event',
      description: 'Dicuplik/dijalankan saat event tertentu dipicu.',
      dynamicMode: 'none',
      dynamicData: null,

      defaultData: {
        settings: {
          headerTitle: 'On Custom Event',
          headerColor: '#3B82F6',
          category: 'Category Name'
        },
        inputs: [],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { id: 'event_data', label: 'Data', dataType: 'string', color: '#FFB74D' }
        ],
        data: {
          code: `const eventData = node._tempData?.dataValue;\n\noutputs['Data'] = eventData;\noutputs['Out'] = true;\nreturn;`
        }
      }
    },
    {
      type: 'action_example_node',
      label: 'Do Something',
      description: 'Mengeksekusi aksi pada target entity atau sistem.',
      dynamicMode: 'none',
      dynamicData: null,

      defaultData: {
        settings: {
          headerTitle: 'Do Something',
          headerColor: '#F59E0B',
          category: 'Category Name'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target_entity', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' },
          { id: 'value_amount', label: 'Amount', dataType: 'number', color: '#B2FF59', defaultValue: 100 }
        ],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { id: 'result', label: 'Result', dataType: 'boolean', color: '#f472b6' }
        ],
        data: {
          code: `const target = inputs['Target Entity'];\nconst amount = inputs['Amount'];\nconst entity = context.getEntity(target);\n\nentity.applyAmount(amount);\n\noutputs['Result'] = true;\noutputs['Out'] = true;\nreturn;`
        }
      }
    },
    {
      type: 'dynamic_example_node',
      label: 'Dynamic Collection',
      description: 'Menerima port input dinamis yang dapat ditambah atau dikurangi.',
      dynamicMode: 'sequential',
      dynamicData: null,

      defaultData: {
        settings: {
          headerTitle: 'Dynamic Collection',
          headerColor: '#00796B',
          category: 'Category Name'
        },
        inputs: [
          { id: 'v0', label: 'Val 1', dataType: 'number', color: '#B2FF59' },
          { id: 'v1', label: 'Val 2', dataType: 'number', color: '#B2FF59' }
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ],
        data: {
          values: { v0: 0, v1: 0 },
          code: `outputs['Result'] = collection.reduce((acc, curr) => acc + curr, 0);\nreturn;`
        }
      }
    }
  ]
};

describe('useNodeBlueprint Integration', () => {
  let pinia;
  let scriptStore;
  let workspaceStore;
  let projectStore;
  let mockStoreRef;

  beforeEach(async () => {
    pinia = createPinia();
    setActivePinia(pinia);

    mockStoreRef = setupMockOPFS();

    projectStore = useProjectStore();
    scriptStore = useScriptStore();
    workspaceStore = useWorkspaceStore();

    const mockProject = await createMockEmptyProject({ projectName: 'Blueprint Integration Project' });
    projectStore.project = mockProject;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (mockStoreRef?.store) {
      mockStoreRef.store.clear();
    }
  });

  describe('Comprehensive Registered Blueprints Audit', () => {
    it('verifies all 8 imported blueprint modules exist and have valid structure', () => {
      expect(allBlueprints).toHaveLength(28);

      allBlueprints.forEach((blueprint) => {
        expect(blueprint).toBeDefined();
        expect(blueprint.id).toBeDefined();
        expect(blueprint.label).toBeDefined();
        expect(Array.isArray(blueprint.items)).toBe(true);

        blueprint.items.forEach((item) => {
          expect(item.type).toBeDefined();
          expect(item.label).toBeDefined();
          expect(item.defaultData).toBeDefined();
          expect(Array.isArray(item.defaultData.inputs)).toBe(true);
          expect(Array.isArray(item.defaultData.outputs)).toBe(true);

          if (item.defaultData.data?.code) {
            const cleanCode = item.defaultData.data.code.trim();
            const hasReturnEnd = cleanCode.endsWith('return;') || cleanCode.endsWith('return');
            
            expect(hasReturnEnd, `Node '${item.type}' di '${blueprint.label}' tidak diakhiri return`).toBe(true);
          }
        });
      });
    });

    it('validates mock category template metadata and rules', () => {
      expect(mockCategoryTemplate.id).toBe('category_template');
      expect(mockCategoryTemplate.items).toHaveLength(3);

      mockCategoryTemplate.items.forEach((item) => {
        const cleanCode = item.defaultData.data.code.trim();
        expect(cleanCode.endsWith('return;') || cleanCode.endsWith('return')).toBe(true);
        expect(item.dynamicMode).toBeDefined();
      });
    });
  });

  describe('Blueprint Registry & Group Initialization', () => {
    it('initializes and sorts node groups alphabetically by label', () => {
      const { nodeGroups } = useNodeBlueprint();

      const labels = nodeGroups.map(g => g.label);
      const sortedLabels = [...labels].sort((a, b) => a.localeCompare(b));

      expect(nodeGroups.length).toBe(28);
      expect(labels).toEqual(sortedLabels);
    });

    it('retrieves correct node blueprint definition by type from registered groups', () => {
      const { getNodeBlueprint } = useNodeBlueprint();
      const sampleItem = BlueprintBoolean.items[0];

      const blueprint = getNodeBlueprint(sampleItem.type);

      expect(blueprint).not.toBeNull();
      expect(blueprint?.type).toBe(sampleItem.type);
      expect(blueprint?.label).toBe(sampleItem.label);
    });

    it('[Bad Path] returns null when node type is unknown', () => {
      const { getNodeBlueprint } = useNodeBlueprint();
      const blueprint = getNodeBlueprint('unknown_node_type_x');
      expect(blueprint).toBeNull();
    });
  });

  describe('Search & Filtering Integration', () => {
    it('filters node items across groups based on active search query', () => {
      const { searchQuery, filteredGroups } = useNodeBlueprint();
      const sampleNode = BlueprintTransform.items[0];

      searchQuery.value = sampleNode.label;

      expect(filteredGroups.value.length).toBeGreaterThan(0);
      const matchedItems = filteredGroups.value.flatMap(g => g.items);
      const targetItem = matchedItems.find(i => i.label === sampleNode.label);

      expect(targetItem).toBeDefined();
      expect(targetItem?.type).toBe(sampleNode.type);
    });

    it('[Bad Path] returns empty groups array when search query finds no matches', () => {
      const { searchQuery, filteredGroups } = useNodeBlueprint();
      searchQuery.value = 'NonExistentQuery_999';
      expect(filteredGroups.value).toHaveLength(0);
    });
  });

  describe('Drag Event Handling', () => {
    it('attaches node payload to dataTransfer during drag start', () => {
      const { onDragNode } = useNodeBlueprint();
      const targetItem = BlueprintKeyboard.items[0];
      const setDataMock = vi.fn();
      const mockEvent = {
        dataTransfer: {
          setData: setDataMock,
          effectAllowed: ''
        }
      };

      onDragNode(mockEvent, targetItem);

      expect(setDataMock).toHaveBeenCalledWith('application/node-template', JSON.stringify(targetItem));
      expect(mockEvent.dataTransfer.effectAllowed).toBe('copy');
    });
  });

  describe('Dynamic Inputs & Code Synchronization', () => {
    it('synchronizes reindexed inputs, dynamic values, and code logic correctly', () => {
      const { syncDynamicInputsAndCode } = useNodeBlueprint();
      const dynamicNode = {
        type: 'dynamic_example_node',
        dynamicMode: 'sequential',
        inputs: [
          { id: 'v0', label: 'Val 1', dataType: 'number' },
          { id: 'v1', label: 'Val 2', dataType: 'number' },
          { id: 'v2', label: 'Val 3', dataType: 'number' }
        ],
        data: {
          values: { v0: 10, v1: 25 },
          code: `outputs['Result'] = collection.reduce((acc, curr) => acc + curr, 0);\nreturn;`
        }
      };

      syncDynamicInputsAndCode(dynamicNode);

      expect(dynamicNode.inputs).toHaveLength(3);
      expect(dynamicNode.inputs[0]).toMatchObject({ id: 'v0', label: 'Val 1' });
      expect(dynamicNode.inputs[1]).toMatchObject({ id: 'v1', label: 'Val 2' });
      expect(dynamicNode.inputs[2]).toMatchObject({ id: 'v2', label: 'Val 3' });

      expect(dynamicNode.data.values).toEqual({
        v0: 10,
        v1: 25,
        v2: 0
      });

      expect(dynamicNode.data.code).toContain("const val1 = inputs['Val 1'];");
      expect(dynamicNode.data.code).toContain("const val2 = inputs['Val 2'];");
      expect(dynamicNode.data.code).toContain("const val3 = inputs['Val 3'];");
      expect(dynamicNode.data.code).toContain('const collection = [val1, val2, val3];');
      expect(dynamicNode.data.code).toContain('outputs[\'Result\'] = collection.reduce((acc, curr) => acc + curr, 0);');
    });

    it('retains execution input ports untouched while reindexing data ports', () => {
      const { syncDynamicInputsAndCode } = useNodeBlueprint();
      const mixedNode = {
        type: 'dynamic_example_node',
        dynamicMode: 'sequential',
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution' },
          { id: 'old_port', label: 'Custom', dataType: 'string' }
        ],
        data: {
          values: {},
          code: ''
        }
      };

      syncDynamicInputsAndCode(mixedNode);

      expect(mixedNode.inputs[0]).toMatchObject({ id: 'exec_in', dataType: 'execution' });
      expect(mixedNode.inputs[1]).toMatchObject({ id: 'v0', label: 'Val 1', dataType: 'string' });
      expect(mixedNode.data.values).toEqual({ v0: '' });
    });

    it('[Bad Path] handles null or malformed node payload without throwing errors', () => {
      const { syncDynamicInputsAndCode } = useNodeBlueprint();

      expect(() => syncDynamicInputsAndCode(null)).not.toThrow();
      expect(() => syncDynamicInputsAndCode({})).not.toThrow();
      expect(() => syncDynamicInputsAndCode({ inputs: 'not_an_array' })).not.toThrow();
    });
  });
});