import { ref, nextTick, markRaw, computed } from 'vue';
import { 
  BookOpen, 
  Layout, 
  Boxes, 
  GitBranch, 
  Gamepad2, 
  Library, 
  GraduationCap 
} from 'lucide-vue-next';
import { ALL_BLUEPRINTS, CUSTOM_NODE_TEMPLATE } from '@nodes/library/blueprints/index.js';
import { CANONICAL_PORT_IDS, getNodeRole } from '@nodes/nodes.js';

const MODULE_DESCRIPTIONS = Object.freeze({
  flow_logic: 'Branching, conditional switches, loops, delays, cooldowns, timers, and flow control.',
  input_controls: 'Keyboard inputs, mouse events, pointer interactions, and movement axes.',
  game_entity: 'Transform manipulation, entity hierarchies, tags, layers, and prefab spawning.',
  game_physics: 'Rigid body dynamics, velocities, forces, impulses, gravity, and raycasting.',
  game_renderer: 'Sprites, shapes, text, camera tracking, screen fades, and visual effects.',
  game_animation: 'Sprite animations, frame playback, timeline controls, and value tweening.',
  data_collections: 'Array lists, key-value maps, iteration helpers, and collection utilities.',
  math_operations: 'Arithmetic calculation, trigonometric operations, and random number generation.',
  game_lifecycle: 'Scene loading, pause/resume states, and script lifecycle callbacks.',
  system_utilities: 'Audio playback, sound effects, blackboard variables, and string utilities.',
  helper_tool: 'Pre-packaged gameplay toolkits for UI widgets, dialogue, platformers, top-down, and AI.'
});

const formatTypeBadge = (type) => {
  if (!type) return 'Any';
  const t = String(type).toLowerCase();
  if (t === 'execution') return 'Execution';
  if (t === 'string') return 'String';
  if (t === 'number') return 'Number';
  if (t === 'boolean') return 'Boolean';
  if (t === 'vector2') return 'Vector2';
  if (t === 'list' || t === 'array') return 'Array';
  if (t === 'map' || t === 'object') return 'Object';
  if (t === 'any') return 'Any';
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const formatDefaultValue = (val) => {
  if (val === undefined) return '-';
  if (val === null) return 'null';
  if (val === '') return '""';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
};

const resolvePortDescription = (portId, direction = 'input') => {
  if (CANONICAL_PORT_IDS[portId]) {
    return CANONICAL_PORT_IDS[portId];
  }
  if (/^case\d+$/i.test(portId)) {
    return `Comparison match value for ${portId}`;
  }
  if (/^onCase\d+$/i.test(portId)) {
    return `Execution branch taken when input matches ${portId.replace(/^onCase/i, 'case ')}`;
  }
  if (/^v\d+$/i.test(portId)) {
    return `Sequential operand value (${portId})`;
  }
  if (/^key\d+$/i.test(portId)) {
    return `Mapped keyboard key trigger (${portId})`;
  }
  if (/^onKey\d+$/i.test(portId)) {
    return `Execution branch triggered when key ${portId.replace(/^onKey/i, '')} is pressed`;
  }
  const words = portId
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
  return direction === 'input' ? `Input parameter for ${words}.` : `Output value for ${words}.`;
};

const formatDynamicMode = (mode) => {
  switch (mode) {
    case 'sequential': return 'Sequential';
    case 'inputProperty': return 'Dynamic input property';
    case 'outputProperty': return 'Dynamic output property';
    case 'switch': return 'Switch cases';
    case 'keyboard': return 'Key mapper';
    case 'none':
    default:
      return 'Fixed';
  }
};

export function useDocsLogic() {
  // 1. Getting Started (Flat)
  const gettingStartedLinks = [
    { id: 'getting_started/introduction', name: 'Introduction' },
    { id: 'getting_started/installation', name: 'Installation & Setup' },
    { id: 'getting_started/quick_start', name: 'Quick Start' },
    { id: 'getting_started/project_and_export', name: 'Project & Export' },
  ];

  // 2. Interface (Flat)
  const interfaceLinks = [
    { id: 'interface/editor_overview', name: 'Editor Overview' },
    { id: 'interface/scene_viewport', name: 'Scene Viewport' },
    { id: 'interface/scene_hierarchy', name: 'Scene Hierarchy' },
    { id: 'interface/property_inspector', name: 'Property Inspector' },
    { id: 'interface/shortcuts', name: 'Shortcuts Reference' },
  ];

  // 3. Components (Level 2 on Visual Renderers)
  const componentsLinks = [
    { id: 'components/entities_and_prefabs', name: 'Entities & Prefabs' },
    { id: 'components/transform', name: 'Transform & UI Transform' },
    {
      id: 'components/renderers',
      name: 'Visual Renderers',
      children: [
        { id: 'components/renderers/sprite_renderer', name: 'Image Renderer' },
        { id: 'components/renderers/shape_renderer', name: 'Shape Renderer' },
        { id: 'components/renderers/text_renderer', name: 'Text Renderer' },
        { id: 'components/renderers/tilemap', name: 'Tilemap' },
      ]
    },
    { id: 'components/sprite_animator', name: 'Sprite Animator' },
    { id: 'components/physics_body', name: 'Physics Body' },
    { id: 'components/multi_collider', name: 'Multi-Collider' },
    { id: 'components/audio_source', name: 'Audio Source' },
    { id: 'components/script_controller', name: 'Script Controller' },
  ];

  // 4. Visual Scripting (Flat)
  const visualScriptingLinks = [
    { id: 'visual_scripting/graph_concepts', name: 'Graph & Node Concepts' },
    { id: 'visual_scripting/variables_and_collections', name: 'Variables & Collections' },
    { id: 'visual_scripting/custom_node_and_code', name: 'Custom Node & Code Panel' },
    { id: 'visual_scripting/context_system_api', name: 'Context System API' },
  ];

  // 5. Behaviour (Level 2)
  const behaviourLinks = [
    {
      id: 'behaviour/movement',
      name: 'Movement',
      children: [
        { id: 'behaviour/movement/platformer', name: 'Platformer Movement' },
        { id: 'behaviour/movement/top_down', name: 'Top-Down Movement' },
        { id: 'behaviour/movement/basic_motion', name: 'Patrol & Basic Motion' },
      ]
    },
    {
      id: 'behaviour/physics_and_collision',
      name: 'Physics & Collision',
      children: [
        { id: 'behaviour/physics_and_collision/physics_and_slopes', name: 'Physics & Slopes' },
        { id: 'behaviour/physics_and_collision/triggers_and_hitboxes', name: 'Triggers & Hitboxes' },
      ]
    },
    {
      id: 'behaviour/ui',
      name: 'User Interface',
      children: [
        { id: 'behaviour/ui/interactive_widgets', name: 'Interactive Widgets' },
        { id: 'behaviour/ui/dynamic_ui', name: 'Dynamic UI & Data Binding' },
      ]
    },
  ];

  // 6. Node Library (Dynamic from ALL_BLUEPRINTS)
  const nodeLibraryLinks = [
    { id: 'node_library/overview', name: 'Overview & Architecture' },
    ...ALL_BLUEPRINTS.map(group => ({
      id: `node_library/${group.id}`,
      name: group.label
    })),
    { id: 'node_library/custom', name: 'Custom Node' }
  ];

  // 7. Tutorials (Flat)
  const tutorialsLinks = [
    { id: 'tutorials/first_platformer', name: 'Your First Platformer Game' },
    { id: 'tutorials/first_top_down', name: 'Your First Top-Down RPG' },
    { id: 'tutorials/building_game_ui', name: 'Your First Visual Novel Game' },
  ];

  const sidebarNav = ref([
    {
      title: 'Getting Started',
      icon: markRaw(BookOpen),
      links: gettingStartedLinks
    },
    {
      title: 'Interface',
      icon: markRaw(Layout),
      links: interfaceLinks
    },
    {
      title: 'Components',
      icon: markRaw(Boxes),
      links: componentsLinks
    },
    {
      title: 'Visual Scripting',
      icon: markRaw(GitBranch),
      links: visualScriptingLinks
    },
    {
      title: 'Behaviour',
      icon: markRaw(Gamepad2),
      links: behaviourLinks
    },
    {
      title: 'Node Library',
      icon: markRaw(Library),
      links: nodeLibraryLinks
    },
    {
      title: 'Tutorials',
      icon: markRaw(GraduationCap),
      links: tutorialsLinks
    }
  ]);

  const flattenDocs = (items, parentPath = []) => {
    let result = [];
    items.forEach(item => {
      const currentPath = [...parentPath, item.name];

      if (item.id) {
        result.push({
          id: item.id,
          name: item.name,
          path: currentPath.join(' > ')
        });
      }

      if (item.children && item.children.length > 0) {
        result = result.concat(flattenDocs(item.children, currentPath));
      }
    });
    return result;
  };

  const allFlatDocs = computed(() => {
    const staticDocs = [
      ...flattenDocs(gettingStartedLinks, ['Getting Started']),
      ...flattenDocs(interfaceLinks, ['Interface']),
      ...flattenDocs(componentsLinks, ['Components']),
      ...flattenDocs(visualScriptingLinks, ['Visual Scripting']),
      ...flattenDocs(behaviourLinks, ['Behaviour']),
      ...flattenDocs(nodeLibraryLinks, ['Node Library']),
      ...flattenDocs(tutorialsLinks, ['Tutorials'])
    ];

    const blueprintNodes = [];
    ALL_BLUEPRINTS.forEach(group => {
      (group.items || []).forEach(node => {
        blueprintNodes.push({
          id: `node_library/${group.id}#node-${node.type}`,
          name: `${node.label || node.type} (${node.type})`,
          path: `Node Library > ${group.label} > ${node.label || node.type}`
        });
      });
    });

    blueprintNodes.push({
      id: 'node_library/custom#node-customScript',
      name: `${CUSTOM_NODE_TEMPLATE.label || 'Custom Node'} (${CUSTOM_NODE_TEMPLATE.type || 'customScript'})`,
      path: `Node Library > Custom Node > ${CUSTOM_NODE_TEMPLATE.label || 'Custom Script'}`
    });

    return [...staticDocs, ...blueprintNodes];
  });

  const searchDocs = (query) => {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    return allFlatDocs.value.filter(doc => 
      doc.name.toLowerCase().includes(q) || 
      doc.path.toLowerCase().includes(q) ||
      doc.id.toLowerCase().includes(q)
    );
  };

  const generateNodeLibraryDoc = (docId) => {
    if (docId === 'node_library/overview') {
      const totalBlueprintNodes = ALL_BLUEPRINTS.reduce((acc, g) => acc + (g.items?.length || 0), 0);
      const totalNodes = totalBlueprintNodes + 1; // including customScript template
      return {
        title: 'Overview & Architecture',
        category: 'Node Library',
        description: `Reference catalog for all **${totalNodes} built-in nodes** across **${ALL_BLUEPRINTS.length} category modules** in Lupis Engine. Port contracts and execution logic synchronize directly with the engine blueprints.`,
        sections: [
          {
            id: 'overview',
            title: 'Overview',
            blocks: [
              {
                type: 'text',
                content: `Visual scripting in Lupis Engine provides a complete library of event, action, and calculation nodes. Logic flows chronologically through execution pins, while data travels through typed value pins.`
              },
              {
                type: 'features',
                items: [
                  { 
                    title: 'Execution Pins', 
                    desc: 'White execution ports direct chronological logic flow between action nodes.' 
                  },
                  { 
                    title: 'Data Channels', 
                    desc: 'Color-coded data pins transmit typed values like numbers, strings, and vectors.' 
                  },
                  { 
                    title: 'Dynamic Ports', 
                    desc: 'Nodes like math, logic, and property accessors expand their pins dynamically.' 
                  },
                  { 
                    title: 'Context System', 
                    desc: 'Underlying node scripts run against the unified engine runtime context facade.' 
                  }
                ]
              }
            ]
          },
          {
            id: 'category-modules',
            title: 'Category modules',
            blocks: [
              {
                type: 'text',
                content: 'Select any module below to inspect its port contracts, dynamic modes, and runtime implementations:'
              },
              {
                type: 'table',
                headers: ['Module', 'Module ID', 'Role / Focus', 'Node Count'],
                rows: [
                  ...ALL_BLUEPRINTS.map(g => [
                    `[${g.label}](node_library/${g.id})`,
                    g.id,
                    MODULE_DESCRIPTIONS[g.id] || 'Gameplay logic and behavior.',
                    String(g.items?.length || 0)
                  ]),
                  [
                    `[Custom Node](node_library/custom)`,
                    'custom',
                    'Extensible JavaScript script template with user-defined ports.',
                    '1'
                  ]
                ]
              },
              {
                type: 'alert',
                variant: 'tip',
                message: 'You can drag any node from the **Node Library** panel onto your graph canvas, or right-click the canvas to open the search picker.'
              }
            ]
          },
          {
            id: 'related',
            title: 'Related',
            blocks: [
              {
                type: 'table',
                headers: ['Page', 'Use it when'],
                rows: [
                  ['[Graph & Node Concepts](visual_scripting/graph_concepts)', 'You want to understand visual scripting graphs and execution flow.'],
                  ['[Variables & Collections](visual_scripting/variables_and_collections)', 'You want to manage blackboard variables, lists, and maps.'],
                  ['[Custom Node & Code Panel](visual_scripting/custom_node_and_code)', 'You want to write custom JavaScript logic directly in nodes.'],
                  ['[Context System API](visual_scripting/context_system_api)', 'You need runtime API method reference documentation.']
                ]
              }
            ]
          }
        ]
      };
    }

    if (docId === 'node_library/custom') {
      const custom = CUSTOM_NODE_TEMPLATE;
      return {
        title: 'Custom Node',
        category: 'Node Library',
        description: 'Extensible custom script node that allows writing custom JavaScript logic directly in the Code Panel.',
        sections: [
          {
            id: 'overview',
            title: 'Overview',
            blocks: [
              {
                type: 'text',
                content: 'The **Custom Node** (`customScript`) lets you run arbitrary JavaScript code within the visual scripting graph. You can define custom input and output ports, store state, and interact with the engine runtime through the `context` API.'
              },
              {
                type: 'alert',
                variant: 'tip',
                message: 'You can convert any standard node into an editable custom node by clicking **Unlock Custom Node** in the Property Inspector.'
              }
            ]
          },
          {
            id: 'node-customScript',
            title: custom.label || 'Custom Script',
            blocks: [
              {
                type: 'text',
                content: custom.description || 'Custom script node with user-defined ports, parameters, and executable logic.'
              },
              {
                type: 'table',
                headers: ['Input Port', 'Type', 'Default', 'Description'],
                rows: [
                  ['execIn', 'Execution', '-', 'Main execution input']
                ]
              },
              {
                type: 'table',
                headers: ['Output Port', 'Type', 'Description'],
                rows: [
                  ['execOut', 'Execution', 'Main execution output']
                ]
              },
              ...(custom.defaultData?.data?.code ? [
                {
                  type: 'code',
                  language: 'javascript',
                  snippet: custom.defaultData.data.code.trim()
                }
              ] : [])
            ]
          },
          {
            id: 'related',
            title: 'Related',
            blocks: [
              {
                type: 'table',
                headers: ['Page', 'Use it when'],
                rows: [
                  ['[Custom Node & Code Panel](visual_scripting/custom_node_and_code)', 'You want step-by-step guidance on creating custom nodes.'],
                  ['[Context System API](visual_scripting/context_system_api)', 'You need documentation on methods available in the context object.']
                ]
              }
            ]
          }
        ]
      };
    }

    const categoryId = docId.replace('node_library/', '');
    const group = ALL_BLUEPRINTS.find(g => g.id === categoryId);
    if (!group) return null;

    const sections = [
      {
        id: 'overview',
        title: 'Overview',
        blocks: [
          {
            type: 'text',
            content: MODULE_DESCRIPTIONS[group.id] 
              ? `The **${group.label}** module provides **${group.items?.length || 0} nodes** designed for ${MODULE_DESCRIPTIONS[group.id].toLowerCase()} Select any node below to inspect its ports and execution logic:`
              : `Reference catalog for all **${group.items?.length || 0} nodes** in the **${group.label}** category.`
          },
          {
            type: 'table',
            headers: ['Node', 'Type ID', 'Role', 'Dynamic Mode'],
            rows: (group.items || []).map(node => [
              `[${node.label || node.type}](#node-${node.type})`,
              node.type,
              getNodeRole(node.defaultData).toUpperCase(),
              formatDynamicMode(node.dynamicMode)
            ])
          }
        ]
      }
    ];

    (group.items || []).forEach(node => {
      const blocks = [
        {
          type: 'text',
          content: node.description || 'Visual scripting node for game logic.'
        }
      ];

      if (node.dynamicMode && node.dynamicMode !== 'none') {
        let alertMessage = 'This node supports dynamic ports managed through the Property Inspector.';
        if (node.dynamicMode === 'sequential') {
          alertMessage = 'This node supports dynamic sequential inputs. Add or remove input pins in the **Property Inspector**.';
        } else if (node.dynamicMode === 'inputProperty') {
          alertMessage = 'This node allows selecting properties to add as dynamic input pins in the **Property Inspector**.';
        } else if (node.dynamicMode === 'outputProperty') {
          alertMessage = 'This node allows selecting properties to add as dynamic output pins in the **Property Inspector**.';
        } else if (node.dynamicMode === 'switch') {
          alertMessage = 'This node supports dynamic switch cases. Add paired case inputs and execution branches in the **Property Inspector**.';
        } else if (node.dynamicMode === 'keyboard') {
          alertMessage = 'This node supports key binding mapping. Configure mapped keys in the **Property Inspector**.';
        }

        blocks.push({
          type: 'alert',
          variant: 'info',
          message: alertMessage
        });
      }

      const inputs = node.defaultData?.inputs || [];
      if (inputs.length > 0) {
        blocks.push({
          type: 'table',
          headers: ['Input Port', 'Type', 'Default', 'Description'],
          rows: inputs.map(p => [
            p.id,
            formatTypeBadge(p.dataType),
            formatDefaultValue(p.defaultValue),
            resolvePortDescription(p.id, 'input')
          ])
        });
      }

      const outputs = node.defaultData?.outputs || [];
      if (outputs.length > 0) {
        blocks.push({
          type: 'table',
          headers: ['Output Port', 'Type', 'Description'],
          rows: outputs.map(p => [
            p.id,
            formatTypeBadge(p.dataType),
            resolvePortDescription(p.id, 'output')
          ])
        });
      }

      const propertyOptions = node.defaultData?.data?.propertyOptions;
      if (Array.isArray(propertyOptions) && propertyOptions.length > 0) {
        blocks.push({
          type: 'table',
          headers: ['Available Property', 'Type', 'Description'],
          rows: propertyOptions.map(opt => [
            opt.value || opt.label,
            formatTypeBadge(opt.type),
            opt.label ? `Configures ${opt.label}` : 'Selectable property option'
          ])
        });
      }

      const options = node.defaultData?.data?.options;
      if (options && typeof options === 'object') {
        Object.entries(options).forEach(([optKey, optList]) => {
          if (Array.isArray(optList) && optList.length > 0) {
            blocks.push({
              type: 'table',
              headers: ['Option', 'Value', 'Setting'],
              rows: optList.map(o => [
                String(o.label || o.value || o),
                String(o.value ?? o),
                optKey
              ])
            });
          }
        });
      }

      const codeSnippet = node.defaultData?.data?.code;
      if (codeSnippet && typeof codeSnippet === 'string' && codeSnippet.trim()) {
        blocks.push({
          type: 'code',
          language: 'javascript',
          snippet: codeSnippet.trim()
        });
      }

      sections.push({
        id: `node-${node.type}`,
        title: node.label || node.type,
        blocks
      });
    });

    sections.push({
      id: 'related',
      title: 'Related',
      blocks: [
        {
          type: 'table',
          headers: ['Page', 'Use it when'],
          rows: [
            ['[Overview & Architecture](node_library/overview)', 'You want to browse all available node categories.'],
            ['[Graph & Node Concepts](visual_scripting/graph_concepts)', 'You want to learn how to wire nodes together in the graph canvas.'],
            ['[Context System API](visual_scripting/context_system_api)', 'You need runtime API method reference documentation.']
          ]
        }
      ]
    });

    return {
      title: group.label,
      category: 'Node Library',
      description: `Reference catalog for all **${group.items?.length || 0} nodes** in the **${group.label}** category. Port contracts and execution logic are synchronized directly from engine blueprints.`,
      sections
    };
  };

  const docsData = ref({}); 
  const currentDocId = ref('getting_started/introduction'); 
  const activeContent = computed(() => docsData.value[currentDocId.value] || null);

  const tocHeadings = ref([]);
  const activeHeadingId = ref('');
  const contentContainer = ref(null);
  let observer = null;
  let isManualScrolling = false;

  const extractHeadings = () => {
    const el = contentContainer.value?.$el || contentContainer.value;
    if (!el) return [];
    
    const allHeadings = Array.from(el.querySelectorAll('h2, h3'));
    const validHeadings = allHeadings.filter(heading => !heading.closest('.not-prose'));

    tocHeadings.value = validHeadings.map(e => ({
      id: e.id,
      text: e.innerText,
      level: e.tagName === 'H2' ? 2 : 3
    }));

    return validHeadings;
  };

  const initToc = async () => {
    await nextTick();
    const headingElements = extractHeadings();
    
    if (!headingElements || headingElements.length === 0) {
      activeHeadingId.value = '';
      return;
    }

    activeHeadingId.value = headingElements[0].id;

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -65% 0px', 
      threshold: 0
    };

    observer = new IntersectionObserver((entries) => {
      if (isManualScrolling) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeHeadingId.value = entry.target.id;
        }
      });
    }, observerOptions);

    headingElements.forEach((el) => observer.observe(el));

    const handleScrollToBottom = () => {
      if (isManualScrolling) return;
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 10;

      if (scrollPosition >= threshold) {
        const lastHeading = tocHeadings.value[tocHeadings.value.length - 1];
        if (lastHeading) {
          activeHeadingId.value = lastHeading.id;
        }
      }
    };

    window.addEventListener('scroll', handleScrollToBottom);
    observer._cleanupScroll = () => window.removeEventListener('scroll', handleScrollToBottom);
  };

  const destroyToc = () => {
    if (observer) {
      if (observer._cleanupScroll) observer._cleanupScroll();
      observer.disconnect();
      observer = null;
    }
  };

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      isManualScrolling = true;
      activeHeadingId.value = id;

      const headerOffset = 85; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      setTimeout(() => {
        isManualScrolling = false;
      }, 1000);
    }
  };

  const fetchDocumentData = async (docId) => {
    if (docsData.value[docId]) return;

    // Check dynamic Node Library first
    if (docId.startsWith('node_library/')) {
      const generated = generateNodeLibraryDoc(docId);
      if (generated) {
        docsData.value[docId] = generated;
        return;
      }
    }

    try {
      const response = await fetch(`/docs/${docId}.json`);
      
      if (!response.ok) {
        throw new Error(`Document ${docId} does not exist.`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Document ${docId} did not return valid JSON.`);
      }
      
      const data = await response.json();
      docsData.value[docId] = data; 
      
    } catch (error) {
      console.warn(error.message);
      
      docsData.value[docId] = {
        title: 'Under Construction',
        category: 'Work in Progress',
        description: 'Documentation for this topic is currently being written.',
        sections: [
          {
            id: 'work-in-progress',
            title: 'Coming Soon',
            blocks: [
              { 
                type: 'text', 
                content: 'We are currently completing this section of the Lupis Engine documentation.' 
              }
            ]
          }
        ]
      };
    }
  };

  const changeDocument = async (newDocId) => {
    await fetchDocumentData(newDocId);
    currentDocId.value = newDocId;
    
    destroyToc();     
    await initToc();  
    
    if (window.location.hash) {
      const hashId = window.location.hash.replace('#', '');
      nextTick(() => {
        setTimeout(() => scrollToHeading(hashId), 150);
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' }); 
    }
  };

  fetchDocumentData(currentDocId.value);

  return {
    sidebarNav,
    activeContent,
    currentDocId,
    tocHeadings,
    activeHeadingId,
    contentContainer,
    scrollToHeading,
    initToc,
    destroyToc,
    changeDocument,
    searchDocs
  };
}
