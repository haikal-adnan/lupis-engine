import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDocsLogic } from '@/features/docs/composables/useDocsLogic.js';
import { ALL_BLUEPRINTS } from '@/features/nodes/library/blueprints/index.js';

describe('useDocsLogic & Node Library Documentation Contract', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({
        title: 'Mock Page',
        category: 'Test',
        description: 'Test description',
        sections: []
      })
    }));
  });

  it('provides the exact menu map conforming to docs/documentation-writing.md v0.1.0', () => {
    const { sidebarNav } = useDocsLogic();

    expect(sidebarNav.value).toHaveLength(6);

    const titles = sidebarNav.value.map(s => s.title);
    expect(titles).toEqual([
      'Getting Started',
      'Interface',
      'Components',
      'Visual Scripting',
      'Behaviour',
      'Node Library'
    ]);

    // Getting Started
    const gettingStarted = sidebarNav.value[0].links.map(l => l.id);
    expect(gettingStarted).toEqual([
      'getting_started/introduction',
      'getting_started/installation',
      'getting_started/quick_start',
      'getting_started/project_and_export'
    ]);

    // Interface
    const iface = sidebarNav.value[1].links.map(l => l.id);
    expect(iface).toEqual([
      'interface/editor_overview',
      'interface/scene_viewport',
      'interface/scene_hierarchy',
      'interface/property_inspector',
      'interface/shortcuts'
    ]);

    // Components
    const components = sidebarNav.value[2].links.map(l => l.id);
    expect(components).toEqual([
      'components/entities_and_prefabs',
      'components/transform',
      'components/renderers',
      'components/sprite_animator',
      'components/physics_body',
      'components/multi_collider',
      'components/audio_source',
      'components/script_controller'
    ]);

    // Visual Scripting
    const vs = sidebarNav.value[3].links.map(l => l.id);
    expect(vs).toEqual([
      'visual_scripting/graph_concepts',
      'visual_scripting/variables_and_collections',
      'visual_scripting/custom_node_and_code',
      'visual_scripting/context_system_api'
    ]);

    // Behaviour
    const behaviour = sidebarNav.value[4].links.map(l => l.id);
    expect(behaviour).toEqual([
      'behaviour/movement',
      'behaviour/physics_and_collision',
      'behaviour/ui'
    ]);

    // Node Library
    const nodeLib = sidebarNav.value[5].links.map(l => l.id);
    expect(nodeLib).toEqual([
      'node_library/overview',
      'node_library/flow_logic',
      'node_library/input_controls',
      'node_library/game_entity',
      'node_library/game_physics',
      'node_library/game_renderer',
      'node_library/game_animation',
      'node_library/data_collections',
      'node_library/math_operations',
      'node_library/game_lifecycle',
      'node_library/system_utilities',
      'node_library/helper_tool',
      'node_library/custom'
    ]);
  });

  it('generates Node Library Overview conforming to schema and documentation standard', async () => {
    const { changeDocument, activeContent } = useDocsLogic();

    await changeDocument('node_library/overview');

    expect(activeContent.value).toBeTruthy();
    expect(activeContent.value.title).toBe('Overview & Architecture');
    expect(activeContent.value.category).toBe('Node Library');
    expect(activeContent.value.sections.length).toBeGreaterThanOrEqual(3);

    const modulesSection = activeContent.value.sections.find(s => s.id === 'category-modules');
    expect(modulesSection).toBeDefined();

    const tableBlock = modulesSection.blocks.find(b => b.type === 'table');
    expect(tableBlock).toBeDefined();
    expect(tableBlock.headers).toEqual(['Module', 'Module ID', 'Role / Focus', 'Node Count']);
    // 11 modules + custom
    expect(tableBlock.rows).toHaveLength(ALL_BLUEPRINTS.length + 1);
  });

  it('generates Custom Node page with valid section IDs and ports', async () => {
    const { changeDocument, activeContent } = useDocsLogic();

    await changeDocument('node_library/custom');

    expect(activeContent.value).toBeTruthy();
    expect(activeContent.value.title).toBe('Custom Node');
    expect(activeContent.value.category).toBe('Node Library');

    const nodeSection = activeContent.value.sections.find(s => s.id === 'node-customScript');
    expect(nodeSection).toBeDefined();
    expect(nodeSection.title).toBe('Custom Node');

    const inputTable = nodeSection.blocks.find(b => b.type === 'table' && b.headers[0] === 'Input Port');
    expect(inputTable).toBeDefined();
    expect(inputTable.rows[0][0]).toBe('execIn');
    expect(inputTable.rows[0][1]).toBe('Execution');
  });

  it('generates dynamic category module pages with node anchors, port contracts, and code', async () => {
    const { changeDocument, activeContent } = useDocsLogic();

    await changeDocument('node_library/flow_logic');

    expect(activeContent.value).toBeTruthy();
    expect(activeContent.value.title).toBe('Flow & Logic');
    expect(activeContent.value.category).toBe('Node Library');

    // Section 1 is category overview
    expect(activeContent.value.sections[0].id).toBe('overview');
    expect(activeContent.value.sections[0].title).toBe('Overview');

    // Every node has an ID conforming to "node-<nodeType>"
    const branchSection = activeContent.value.sections.find(s => s.id === 'node-logicBranch');
    expect(branchSection).toBeDefined();
    expect(branchSection.title).toBe('Branch (If/Else)');

    // Input table has Canonical Port Descriptions
    const inputTable = branchSection.blocks.find(b => b.type === 'table' && b.headers[0] === 'Input Port');
    expect(inputTable).toBeDefined();
    expect(inputTable.headers).toEqual(['Input Port', 'Type', 'Default', 'Description']);

    // execIn description from CANONICAL_PORT_IDS
    const execInRow = inputTable.rows.find(r => r[0] === 'execIn');
    expect(execInRow[1]).toBe('Execution');
    expect(execInRow[3]).toBe('Main execution input');

    // condition description
    const condRow = inputTable.rows.find(r => r[0] === 'condition');
    expect(condRow[1]).toBe('Boolean');
    expect(condRow[2]).toBe('false');
    expect(condRow[3]).toBe('Boolean condition');

    // Output table
    const outputTable = branchSection.blocks.find(b => b.type === 'table' && b.headers[0] === 'Output Port');
    expect(outputTable).toBeDefined();
    expect(outputTable.headers).toEqual(['Output Port', 'Type', 'Description']);

    const onTrueRow = outputTable.rows.find(r => r[0] === 'onTrue');
    expect(onTrueRow[1]).toBe('Execution');
    expect(onTrueRow[2]).toBe('Branch taken when condition is true');

    // Code block
    const codeBlock = branchSection.blocks.find(b => b.type === 'code');
    expect(codeBlock).toBeDefined();
    expect(codeBlock.language).toBe('javascript');
    expect(codeBlock.snippet).toContain('outputs.onTrue = condition');
  });

  it('indexes blueprint nodes in search so searching node names finds them directly', () => {
    const { searchDocs } = useDocsLogic();

    const branchResults = searchDocs('logicBranch');
    expect(branchResults.length).toBeGreaterThanOrEqual(1);
    expect(branchResults[0].id).toBe('node_library/flow_logic#node-logicBranch');
    expect(branchResults[0].path).toContain('Flow & Logic');

    const moveResults = searchDocs('moveAndSlide');
    expect(moveResults.length).toBeGreaterThanOrEqual(1);
    expect(moveResults[0].id).toBe('node_library/game_physics#node-moveAndSlide');
  });

  it('supports bilingual navigation switching between en and id', async () => {
    const { sidebarNav, setLanguage, currentLang } = useDocsLogic();

    expect(currentLang.value).toBe('en');
    expect(sidebarNav.value[0].title).toBe('Getting Started');
    expect(sidebarNav.value[0].links[0].name).toBe('Introduction');

    await setLanguage('id');

    expect(currentLang.value).toBe('id');
    expect(sidebarNav.value[0].title).toBe('Memulai');
    expect(sidebarNav.value[0].links[0].name).toBe('Pengenalan');
    expect(sidebarNav.value[1].title).toBe('Antarmuka');
    expect(sidebarNav.value[2].title).toBe('Komponen');

    await setLanguage('en');
    expect(currentLang.value).toBe('en');
    expect(sidebarNav.value[0].title).toBe('Getting Started');
  });
});
