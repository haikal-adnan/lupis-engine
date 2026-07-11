import { ref, nextTick, markRaw, computed } from 'vue';
import { BookOpen, Layers, Settings } from 'lucide-vue-next';

export function useDocsLogic() {
  const gettingStartedLinks = [
    { id: 'getting_started/introduction', name: 'Introduction' },
    { id: 'getting_started/installation', name: 'Installation' },
  ];

  const interfaceLinks = [
    {
      id: 'interface/global_control/global_control', 
      name: 'Global Control',
      children: [
        { id: 'interface/global_control/project_actions/project_actions', name: 'Project Actions' },
        { id: 'interface/global_control/tab_manager/tab_manager', name: 'Tab Manager' },
        { id: 'interface/global_control/quick_action/quick_action', name: 'Quick Actions' },
      ]
    },
    {
      id: 'main-workspace-wrapper', 
      name: 'Main Workspace',
      children: [
        {
          id: 'scene-editor-wrapper', 
          name: 'Scene Editor',
          children: [
            { id: 'interface/main_workspace/scene_editor/canvas_scene/canvas_scene', name: 'Canvas Scene' },
            { id: 'interface/main_workspace/scene_editor/hierarchy_scene/hierarchy_scene', name: 'Hierarchy Scene' },
            { id: 'interface/main_workspace/scene_editor/property_inspector/property_inspector', name: 'Property Inspector' },
            { id: 'interface/main_workspace/scene_editor/floating_toolbar/floating_toolbar', name: 'Floating Toolbar' },
            { 
              id: 'interface/main_workspace/scene_editor/bottom_dock', 
              name: 'Bottom Dock',
              children: [
                { id: 'interface/main_workspace/scene_editor/bottom_dock/assets_panel/assets_panel', name: 'Assets Panel' },
                { id: 'interface/main_workspace/scene_editor/bottom_dock/scripts_panel/scripts_panel', name: 'Scripts Panel' },
                { id: 'interface/main_workspace/scene_editor/bottom_dock/console_panel/console_panel', name: 'Console Panel' },
                { id: 'interface/main_workspace/scene_editor/bottom_dock/prefabs_panel/prefabs_panel', name: 'Prefabs Panel' },
              ]
            },
          ]
        },
        {
          id: 'script-editor-wrapper',
          name: 'Script Editor (Visual Logic)',
          children: [
            { id: 'interface/main_workspace/script_editor/node_script/node_script', name: 'Node Script' },
            { 
              id: 'interface/main_workspace/script_editor/variable_manager/variable_manager', 
              name: 'Variable Manager',
              children: [
                { id: 'interface/main_workspace/script_editor/variable_manager/collection_management/collection_management', name: 'Collection Management' },
              ]
            },
            { id: 'interface/main_workspace/script_editor/node_library/node_library', name: 'Node Library' },
            { id: 'interface/main_workspace/script_editor/node_inspector/node_inspector', name: 'Node Inspector' }
          ]
        },
        {
          id: 'animator-editor-wrapper', 
          name: 'Animator Editor',
          children: [
            { id: 'interface/main_workspace/animator_editor/animation_view/animation_view', name: 'Animation View' },
            { id: 'interface/main_workspace/animator_editor/animation_clip/animation_clip', name: 'Clip Manager' },
            { id: 'interface/main_workspace/animator_editor/animation_property/animation_property', name: 'Animation Property' },
            { id: 'interface/main_workspace/animator_editor/animation_timeline/animation_timeline', name: 'Animation Timeline' }
          ]
        },
        {
          id: 'interface/main_workspace/tilemap_editor/tilemap_editor',
          name: 'Tilemap Editor',
        }
      ]
    },
  ];

  const configurationLinks = [
    { id: 'aCheatSheet', name: 'Cheat Sheet' },
  ];

  const sidebarNav = ref([
    {
      title: 'Getting Started',
      icon: markRaw(BookOpen),
      links: gettingStartedLinks
    },
    {
      title: 'Interface',
      icon: markRaw(Layers),
      links: interfaceLinks
    },
    {
      title: 'Configuration',
      icon: markRaw(Settings),
      links: configurationLinks
    }
  ]);

  const flattenDocs = (items, parentPath = []) => {
    let result = [];
    items.forEach(item => {
      const currentPath = [...parentPath, item.name];

      const isWrapperOnly = [
        'main-workspace-wrapper', 
        'scene-editor-wrapper', 
        'script-editor-wrapper', 
        'animator-editor-wrapper'
      ].includes(item.id);

      if (item.id && !isWrapperOnly) {
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
    return [
      ...flattenDocs(gettingStartedLinks, ['Getting Started']),
      ...flattenDocs(interfaceLinks, ['Interface']),
      ...flattenDocs(configurationLinks, ['Configuration'])
    ];
  });

  const searchDocs = (query) => {
    if (!query) return [];
    const q = query.toLowerCase();
    return allFlatDocs.value.filter(doc => 
      doc.name.toLowerCase().includes(q) || 
      doc.path.toLowerCase().includes(q)
    );
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
        behavior: "smooth"
      });

      setTimeout(() => {
        isManualScrolling = false;
      }, 1000);
    }
  };

  const fetchDocumentData = async (docId) => {
    if (docsData.value[docId]) return;

    try {
      const response = await fetch(`/docs/${docId}.json`);
      
      if (!response.ok) {
        throw new Error(`Dokumen ${docId} belum ada.`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Dokumen ${docId} tidak mengembalikan JSON valid (terjadi fallback HTML).`);
      }
      
      const data = await response.json();
      docsData.value[docId] = data; 
      
    } catch (error) {
      console.warn(error.message);
      
      docsData.value[docId] = {
        title: "Sedang Dikerjakan",
        category: "Work in Progress",
        description: "Halaman dokumentasi untuk topik ini masih dalam tahap penulisan.",
        sections: [
          {
            id: "contribution-notice",
            title: "Bantu Kami Menulis",
            blocks: [
              { 
                type: "text", 
                content: "Kami sedang berusaha melengkapi seluruh bagian dokumentasi Lupis Engine." 
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
    
    window.scrollTo({ top: 0, behavior: 'auto' }); 
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