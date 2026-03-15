<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useDocsLogic } from '@/modules/docs/composables/useDocsLogic';
import DocsSidebarLeft from '@/modules/docs/views/DocsSidebarLeft.vue';
import DocsSidebarRight from '@/modules/docs/views/DocsSidebarRight.vue';
import DocsContent from '@/modules/docs/views/DocsContent.vue';

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

onMounted(() => {
  initToc();
});

onUnmounted(() => {
  destroyToc();
});
</script>

<template>
  <div class="flex-1 max-w-[1400px] mx-auto w-full flex items-start px-4 lg:px-6">
    
    <DocsSidebarLeft :nav-items="sidebarNav" />

    <main class="flex-1 min-w-0 py-8 lg:px-12 xl:px-16 pb-24" ref="contentContainer">
      
      <div v-if="activeContent" class="mb-6 text-sm text-muted-foreground flex items-center gap-2">
        <span>Docs</span> <span class="text-border">/</span>
        <span>{{ activeContent.category || 'Documentation' }}</span> <span class="text-border">/</span>
        <span class="text-foreground font-medium">{{ activeContent.title }}</span>
      </div>

      <DocsContent :data="activeContent" />
      
    </main>

    <DocsSidebarRight 
      :headings="tocHeadings" 
      :active-id="activeHeadingId" 
      @scroll-to="scrollToHeading" 
    />

  </div>
</template>