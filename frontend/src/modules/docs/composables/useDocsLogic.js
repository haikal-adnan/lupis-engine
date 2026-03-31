import { ref, nextTick, markRaw, computed } from 'vue';
import { BookOpen, Layers, Code2, Settings, Zap, Box } from 'lucide-vue-next';

export function useDocsLogic() {
  const docsData = ref({
    'introduction': {
        title: 'Lupis Engine: Visual Scripting & 2D Power',
        category: 'Getting Started',
        description: 'Selamat datang di dokumentasi Lupis Engine. Di sini kamu akan mempelajari cara membangun game 2D berperforma tinggi menggunakan sistem Node-Based yang intuitif.',
        infoBox: 'Lupis Engine v1.0 mendukung ekspor ke Web, Android, dan Desktop secara native.',
        features: [
          { title: 'Ultra Fast', desc: 'WebGL 2.0 Rendering.', icon: 'Zap', color: 'text-yellow-500' },
          { title: 'Visual Editor', desc: 'No-code logic editor.', icon: 'Layers', color: 'text-blue-500' },
          { title: 'Asset Manager', desc: 'Auto-packing textures.', icon: 'Box', color: 'text-purple-500' },
          { title: 'Open Source', desc: 'Community driven core.', icon: 'BookOpen', color: 'text-green-500' }
        ],
        sections: [
        {
            id: 'getting-started-video',
            title: 'Lihat Engine dalam Aksi',
            content: 'Video di bawah menunjukkan betapa cepatnya membuat sebuah karakter bergerak menggunakan sistem Visual Logic kami.',
            video: {
              url: 'https://vjs.zencdn.net/v/oceans.mp4',
              poster: 'https://placehold.co/800x450/1e1e2e/indigo?text=Video+Preview',
              caption: 'Visual Editor: Menghubungkan node Move ke input Keyboard.',
              autoplay: true,
              loop: true,
              muted: true,
              controls: false
            }
        },
        {
            id: 'editor-shortcuts',
            title: 'Shortcut Editor',
            content: 'Gunakan shortcut ini untuk mempercepat workflow pengembangan game kamu di dalam Visual Editor.',
            shortcuts: [
              { keys: ['Space', 'Drag'], description: 'Pan / Geser Viewport' },
              { keys: ['Ctrl', 'D'], description: 'Duplicate Entity' },
              { keys: ['Delete'], description: 'Hapus Node yang dipilih' },
              { keys: ['Ctrl', 'Z'], description: 'Undo action' }
            ],
            alert: {
              type: 'tip',
              message: 'Kamu bisa mengubah tema editor menjadi "Amoled Dark" di menu Settings.'
            }
        },
        {
            id: 'installation-guide',
            title: 'Instalasi Programmatic',
            content: 'Bagi developer yang lebih suka menulis code, Lupis bisa diinstal melalui NPM.',
            code: {
              language: 'bash',
              snippet: 'npm install @lupis/core @lupis/physics\nnpm run dev'
            },
            alert: {
              type: 'warning',
              message: 'Pastikan versi Node.js kamu di atas v18.0.0 untuk menghindari error saat build.'
            }
        },
        {
            id: 'asset-workflow',
            title: 'Workflow Import Asset',
            content: 'Ikuti langkah-langkah berikut untuk memasukkan asset gambar ke dalam game kamu.',
            steps: [
              'Buka folder "Assets" di panel sebelah kiri.',
              'Drag file .png atau .jpg kamu langsung ke dalam editor.',
              'Lupis akan otomatis membuat SpriteSheet jika kamu memasukkan lebih dari 5 gambar.',
              'Tarik asset tersebut ke Viewport untuk menjadikannya Entity baru.'
            ],
            image: {
              url: 'https://placehold.co/800x400/1e1e2e/indigo?text=Asset+Import+GIF+Demo',
              alt: 'Asset import demo',
              caption: 'Lupis Engine secara otomatis mengoptimalkan ukuran gambar saat di-import.'
            }
        },
        {
            id: 'api-reference',
            title: 'Sprite Properties API',
            content: 'Berikut adalah tabel referensi properti yang bisa kamu akses melalui script maupun editor.',
            table: {
              headers: ['Property', 'Type', 'Default', 'Description'],
              rows: [
                  ['position', 'Vector2', '{x:0, y:0}', 'Posisi entity di koordinat world.'],
                  ['anchor', 'Vector2', '{x:0.5, y:0.5}', 'Titik pusat rotasi dan scaling.'],
                  ['visible', 'Boolean', 'true', 'Menentukan apakah sprite dirender.'],
                  ['texture', 'String', '""', 'ID Asset gambar yang digunakan.'],
                  ['alpha', 'Number', '1.0', 'Tingkat transparansi (0.0 - 1.0).']
              ]
            },
            alert: {
              type: 'danger',
              message: 'Jangan mengubah properti "anchor" saat animasi sedang berjalan karena akan merusak perhitungan bounding box.'
            }
        }
        ]
    }
  });

  const currentDocId = ref('introduction'); 
  const activeContent = computed(() => docsData.value[currentDocId.value] || null);

  const sidebarNav = ref([
    {
      title: 'Getting Started',
      icon: markRaw(BookOpen),
      links: [
        { id: 'introduction', name: 'Introduction', href: '#introduction', active: true },
        { id: 'installation', name: 'Installation', href: '#installation', active: false },
        { id: 'quick-start', name: 'Quick Start', href: '#quick-start', active: false },
      ]
    },
    {
      title: 'Core Concepts',
      icon: markRaw(Layers),
      links: [
        { id: 'game-loop', name: 'The Game Loop', href: '#', active: false },
        { id: 'ecs', name: 'Entities & Components', href: '#', active: false },
      ]
    },
    {
      title: 'API Reference',
      icon: markRaw(Code2),
      links: []
    },
    {
      title: 'Configuration',
      icon: markRaw(Settings),
      links: [
        { id: 'config-options', name: 'Configuration Options', href: '#', active: false },
      ]
    }
  ]);

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
    
    if (!headingElements || headingElements.length === 0) return;

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

  const changeDocument = async (newDocId) => {
    currentDocId.value = newDocId;
    destroyToc();     
    await initToc();  
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  return {
    sidebarNav,
    activeContent,
    tocHeadings,
    activeHeadingId,
    contentContainer,
    scrollToHeading,
    initToc,
    destroyToc,
    changeDocument
  };
}