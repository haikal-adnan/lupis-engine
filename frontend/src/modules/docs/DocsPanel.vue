<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  Gamepad2, Search, BookOpen, Code2, GraduationCap, 
  Settings, Zap, Layers, Cpu, Box, Info
} from 'lucide-vue-next';

// --- MOCK DATA: Left Sidebar Navigation ---
const sidebarNav = [
  {
    title: 'Getting Started',
    icon: BookOpen,
    links: [
      { name: 'Introduction', href: '#introduction', active: true },
      { name: 'Installation', href: '#installation', active: false },
      { name: 'Quick Start', href: '#quick-start', active: false },
      { name: 'Project Structure', href: '#project-structure', active: false },
    ]
  },
  {
    title: 'Core Concepts',
    icon: Layers,
    links: [
      { name: 'The Game Loop', href: '#the-game-loop', active: false },
      { name: 'Entities & Components', href: '#', active: false },
      { name: 'Rendering System', href: '#', active: false },
    ]
  },
  {
    title: 'API Reference',
    icon: Code2,
    links: []
  },
  {
    title: 'Configuration',
    icon: Settings,
    links: [
      { name: 'Configuration Options', href: '#configuration-options', active: false },
    ]
  }
];

// --- DYNAMIC TOC (Right Sidebar) LOGIC ---
const tocHeadings = ref([]);
const activeHeadingId = ref('');
const contentContainer = ref(null);

// Fungsi untuk mengekstrak h2 dan h3 dari konten tengah
const extractHeadings = () => {
  if (!contentContainer.value) return;
  
  const elements = contentContainer.value.querySelectorAll('h2, h3');
  tocHeadings.value = Array.from(elements).map(el => ({
    id: el.id,
    text: el.innerText,
    level: el.tagName === 'H2' ? 2 : 3
  }));
};

// Fungsi untuk Scroll Spy (menandai menu kanan saat di-scroll)
const handleScroll = () => {
  if (!contentContainer.value) return;
  
  const elements = contentContainer.value.querySelectorAll('h2, h3');
  let currentActive = activeHeadingId.value;

  // Offset 100px untuk mengkompensasi fixed header
  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top <= 120) {
      currentActive = el.id;
    }
  });

  activeHeadingId.value = currentActive;
};

// Fungsi untuk smooth scroll saat menu kanan diklik
const scrollToHeading = (id) => {
  const element = document.getElementById(id);
  if (element) {
    const headerOffset = 80; // Tinggi navbar
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
    activeHeadingId.value = id;
  }
};

onMounted(async () => {
  await nextTick();
  extractHeadings();
  // Set default active heading
  if (tocHeadings.value.length > 0) {
    activeHeadingId.value = tocHeadings.value[0].id;
  }
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="flex-1 max-w-[1400px] mx-auto w-full flex items-start px-4 lg:px-6">
    
    <aside class="hidden lg:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto py-8 pr-6 border-r border-border custom-scrollbar">
      <nav class="space-y-6">
        <div v-for="(section, index) in sidebarNav" :key="index">
          <div class="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground">
            <component :is="section.icon" class="w-4 h-4 text-muted-foreground" />
            {{ section.title }}
          </div>
          <ul v-if="section.links.length" class="space-y-1 border-l border-border ml-2 pl-4">
            <li v-for="link in section.links" :key="link.name">
              <a 
                :href="link.href" 
                class="block py-1.5 text-sm transition-colors rounded-md px-2 -ml-2"
                :class="link.active 
                  ? 'text-indigo-500 font-medium bg-indigo-500/5' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'"
              >
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </aside>

    <main class="flex-1 min-w-0 py-8 lg:px-12 xl:px-16 pb-24" ref="contentContainer">
      
      <div class="mb-6 text-sm text-muted-foreground flex items-center gap-2">
        <span>Docs</span> <span class="text-border">/</span>
        <span>Getting Started</span> <span class="text-border">/</span>
        <span class="text-foreground font-medium">Introduction</span>
      </div>

      <div class="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-a:text-indigo-500 hover:prose-a:text-indigo-600">
        
        <h1 id="introduction" class="text-4xl font-extrabold tracking-tight mb-4 text-foreground">Introduction</h1>
        <p class="text-lg text-muted-foreground mb-8 leading-relaxed">
          Lupis Engine is a lightweight, high-performance 2D game engine built for the modern web. 
          Create beautiful pixel-art games, platformers, and interactive experiences with an intuitive API.
        </p>

        <div class="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-4 mb-8 flex gap-3 items-start">
          <Info class="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <h4 class="text-sm font-semibold text-foreground mb-1">New to Lupis Engine?</h4>
            <p class="text-sm text-muted-foreground m-0">
              Follow our <a href="#" class="font-medium underline underline-offset-4">Quick Start guide</a> to create your first game in under 5 minutes.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 not-prose">
          <div class="border border-border rounded-xl p-5 hover:border-indigo-500/30 transition-colors bg-card">
            <Zap class="w-5 h-5 text-indigo-500 mb-3" />
            <h3 class="font-semibold text-foreground mb-1">60 FPS Rendering</h3>
            <p class="text-sm text-muted-foreground">WebGL-powered rendering with automatic batching and culling.</p>
          </div>
          <div class="border border-border rounded-xl p-5 hover:border-indigo-500/30 transition-colors bg-card">
            <BookOpen class="w-5 h-5 text-indigo-500 mb-3" />
            <h3 class="font-semibold text-foreground mb-1">ECS Architecture</h3>
            <p class="text-sm text-muted-foreground">Flexible Entity-Component-System for scalable game logic.</p>
          </div>
          <div class="border border-border rounded-xl p-5 hover:border-indigo-500/30 transition-colors bg-card">
            <Zap class="w-5 h-5 text-orange-500 mb-3" />
            <h3 class="font-semibold text-foreground mb-1">Built-in Physics</h3>
            <p class="text-sm text-muted-foreground">Collision detection, rigid bodies, and spatial hashing.</p>
          </div>
          <div class="border border-border rounded-xl p-5 hover:border-indigo-500/30 transition-colors bg-card">
            <Box class="w-5 h-5 text-amber-600 mb-3" />
            <h3 class="font-semibold text-foreground mb-1">Asset Pipeline</h3>
            <p class="text-sm text-muted-foreground">Automatic sprite sheet packing, audio loading, and caching.</p>
          </div>
        </div>

        <h2 id="installation" class="text-2xl font-bold border-b border-border pb-2 mb-6 text-foreground mt-12">Installation</h2>
        <p class="mb-4 text-muted-foreground">Install Lupis Engine via your preferred package manager:</p>
        
        <div class="bg-[#1e1e2e] text-slate-300 rounded-lg p-4 mb-8 font-mono text-sm flex justify-between items-center border border-[#313244]">
          <code>npm install lupis-engine</code>
          <span class="text-xs text-slate-500 uppercase tracking-wider">bash</span>
        </div>

        <h2 id="configuration-options" class="text-2xl font-bold border-b border-border pb-2 mb-6 text-foreground mt-12">Configuration Options</h2>
        <p class="mb-4 text-muted-foreground">
          The <code class="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-sm font-mono border border-indigo-500/20">Engine</code> constructor accepts a configuration object with the following properties:
        </p>

        <div class="overflow-x-auto mb-12 not-prose border border-border rounded-lg">
          <table class="w-full text-sm text-left">
            <thead class="bg-muted/50 text-foreground font-semibold border-b border-border">
              <tr>
                <th class="px-4 py-3">Property</th>
                <th class="px-4 py-3">Type</th>
                <th class="px-4 py-3">Default</th>
                <th class="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border text-muted-foreground bg-card">
              <tr class="hover:bg-muted/30 transition-colors">
                <td class="px-4 py-3 font-mono text-indigo-500 bg-indigo-500/5 inline-block m-2 rounded">width</td>
                <td class="px-4 py-3 font-mono text-xs">number</td>
                <td class="px-4 py-3 font-mono text-xs">800</td>
                <td class="px-4 py-3">Canvas width in pixels</td>
              </tr>
              <tr class="hover:bg-muted/30 transition-colors">
                <td class="px-4 py-3 font-mono text-indigo-500 bg-indigo-500/5 inline-block m-2 rounded">height</td>
                <td class="px-4 py-3 font-mono text-xs">number</td>
                <td class="px-4 py-3 font-mono text-xs">600</td>
                <td class="px-4 py-3">Canvas height in pixels</td>
              </tr>
              <tr class="hover:bg-muted/30 transition-colors">
                <td class="px-4 py-3 font-mono text-indigo-500 bg-indigo-500/5 inline-block m-2 rounded">backgroundColor</td>
                <td class="px-4 py-3 font-mono text-xs">string</td>
                <td class="px-4 py-3 font-mono text-xs">'#000000'</td>
                <td class="px-4 py-3">Background clear color</td>
              </tr>
              <tr class="hover:bg-muted/30 transition-colors">
                <td class="px-4 py-3 font-mono text-indigo-500 bg-indigo-500/5 inline-block m-2 rounded">antialias</td>
                <td class="px-4 py-3 font-mono text-xs">boolean</td>
                <td class="px-4 py-3 font-mono text-xs">false</td>
                <td class="px-4 py-3">Enable anti-aliasing</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="the-game-loop" class="text-2xl font-bold border-b border-border pb-2 mb-6 text-foreground mt-12">The Game Loop</h2>
        <p class="mb-4 text-muted-foreground leading-relaxed">
          Lupis Engine uses a fixed-timestep game loop with interpolation for smooth rendering. The 
          <code class="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-sm font-mono border border-indigo-500/20">update</code> method runs at a fixed rate (default 60 times per second), while 
          <code class="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-sm font-mono border border-indigo-500/20">render</code> runs as fast as the browser allows.
        </p>
        
        <div class="h-64"></div>

      </div>
    </main>

    <aside class="hidden xl:block w-56 shrink-0 h-[calc(100vh-4rem)] sticky top-16 py-8 pl-4">
      <div class="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">On this page</div>
      <nav class="border-l border-border">
        <ul class="space-y-2">
          <li v-for="heading in tocHeadings" :key="heading.id">
            <a 
              :href="`#${heading.id}`"
              @click.prevent="scrollToHeading(heading.id)"
              class="block py-1 text-sm transition-colors relative border-l-2 -ml-[1px]"
              :class="[
                heading.level === 3 ? 'pl-6' : 'pl-4',
                activeHeadingId === heading.id 
                  ? 'border-indigo-500 text-indigo-500 font-medium' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              ]"
            >
              {{ heading.text }}
            </a>
          </li>
        </ul>
      </nav>
    </aside>

  </div>
</template>

<style scoped>
/* Opsional: Membuat scrollbar lebih rapi untuk sidebar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border); /* Asumsi tailwind border color */
  border-radius: 4px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #cbd5e1; /* slate-300 */
}
</style>