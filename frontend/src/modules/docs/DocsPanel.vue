<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useDocsLogic } from '@/modules/docs/composables/useDocsLogic';
import DocsSidebarLeft from '@/modules/docs/views/DocsSidebarLeft.vue';
import DocsSidebarRight from '@/modules/docs/views/DocsSidebarRight.vue';
import DocsContent from '@/modules/docs/views/DocsContent.vue';
import { Menu } from 'lucide-vue-next'; // <-- Tambahkan import icon Menu

const {
  sidebarNav,
  activeContent,     
  tocHeadings,
  activeHeadingId,
  contentContainer,
  scrollToHeading,
  initToc,
  destroyToc,
  changeDocument     
} = useDocsLogic();

// --- STATE UNTUK MOBILE SIDEBAR ---
const isMobileSidebarOpen = ref(false);

onMounted(() => {
  initToc();
});

onUnmounted(() => {
  destroyToc();
});
</script>

<template>
  <div class="flex-1 max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row items-start lg:px-6">
    
    <div class="lg:hidden w-full py-4 border-b border-border flex items-center sticky top-16 bg-background z-30 px-4 mb-4">
      <button 
        @click="isMobileSidebarOpen = true" 
        class="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-cyan-500 transition-colors"
      >
        <Menu class="w-5 h-5" />
        Docs Menu
      </button>
    </div>

    <DocsSidebarLeft 
      :nav-items="sidebarNav" 
      :is-open="isMobileSidebarOpen"
      @close="isMobileSidebarOpen = false"
    />

    <main class="flex-1 min-w-0 px-4 py-4 lg:py-8 lg:px-12 xl:pr-8 xl:pl-12 pb-24 w-full" ref="contentContainer">
      <div v-if="activeContent" class="mb-6 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
        <span>Docs</span> <span class="text-border">/</span>
        <span>{{ activeContent.category || 'Documentation' }}</span> <span class="text-border">/</span>
        <span class="text-foreground font-medium">{{ activeContent.title }}</span>
      </div>

      <DocsContent :data="activeContent" />
    </main>

    <DocsSidebarRight 
      class="hidden xl:block"
      :headings="tocHeadings" 
      :active-id="activeHeadingId" 
      @scroll-to="scrollToHeading" 
    />

  </div>
</template>