<script setup>
import { ref, watch, nextTick, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router'; 
import { useDocsLogic } from '@/modules/docs/composables/useDocsLogic';
import DocsSidebarLeft from '@/modules/docs/views/DocsSidebarLeft.vue';
import DocsSidebarRight from '@/modules/docs/views/DocsSidebarRight.vue';
import DocsContent from '@/modules/docs/views/DocsContent.vue';
import { Menu, Search, Layers, Box } from 'lucide-vue-next'; 

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
});

const route = useRoute();  
const router = useRouter();

const {
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
} = useDocsLogic();

const isMobileSidebarOpen = ref(false);

const searchResults = computed(() => {
  return searchDocs(props.searchQuery);
});

watch(() => route.params.docPath, (newPath) => {
  if (newPath) {
    const pathId = Array.isArray(newPath) ? newPath.join('/') : newPath;
    
    if (pathId !== currentDocId.value) {
      changeDocument(pathId);
    }
  }
}, { immediate: true });

const navigateAndPush = (docId) => {
  if (docId !== currentDocId.value) {
    router.push({ path: `/docs/${docId}` }); 
    changeDocument(docId); 
  }
};

watch(activeContent, async (newContent) => {
  if (newContent) {
    destroyToc(); 
    await nextTick(); 
    initToc(); 
  }
}, { immediate: true });

onUnmounted(() => {
  destroyToc();
});

const handleSmartRouting = async (url) => {
  const [docId, sectionId] = url.split('#');

  if (docId && docId !== currentDocId.value) {
    router.push({ path: `/docs/${docId}`, hash: sectionId ? `#${sectionId}` : '' });
    await changeDocument(docId); 
    
    if (sectionId) {
      setTimeout(() => {
        scrollToHeading(sectionId);
      }, 100); 
    }
  } 
  else if (sectionId) {
    router.replace({ hash: `#${sectionId}` }); 
    scrollToHeading(sectionId);
  }
};
</script>

<template>
  <div class="flex-1 max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row items-start lg:px-6">
    
    <!-- Header Mobile untuk Menu -->
    <div class="lg:hidden w-full py-4 border-b border-border flex items-center sticky top-16 bg-background z-30 px-4 mb-4">
      <button 
        @click="isMobileSidebarOpen = true" 
        class="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-cyan-500 transition-colors"
      >
        <Menu class="w-5 h-5" />
        Docs Menu
      </button>
    </div>

    <!-- Sidebar Kiri -->
    <DocsSidebarLeft 
      :nav-items="sidebarNav" 
      :current-doc-id="currentDocId"
      :is-open="isMobileSidebarOpen"
      @close="isMobileSidebarOpen = false"
      @navigate="navigateAndPush" 
    />

    <main class="flex-1 min-w-0 min-h-screen px-4 py-4 lg:py-8 lg:px-12 xl:pr-8 xl:pl-12 pb-24 w-full relative" ref="contentContainer">
      
      <!-- ===== TAMPILAN JIKA SEDANG MENCARI ===== -->
      <div v-if="props.searchQuery" class="animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
         <h2 class="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Search class="w-6 h-6 text-cyan-500" />
            Pencarian Dokumen: <span class="text-cyan-500">"{{ props.searchQuery }}"</span>
         </h2>

         <!-- State Kosong / Tidak Ketemu -->
         <div v-if="searchResults.length === 0" class="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-xl border border-border border-dashed">
            <Box class="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p class="text-lg font-medium text-foreground">Tidak ada dokumen yang ditemukan</p>
            <p class="text-sm text-muted-foreground mt-1">Coba gunakan istilah lain atau periksa ejaan Anda.</p>
         </div>

         <!-- Daftar Hasil Pencarian -->
         <div v-else class="grid grid-cols-1 gap-3">
            <div
              v-for="doc in searchResults"
              :key="doc.id"
              @click="navigateAndPush(doc.id)"
              class="group flex flex-col p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
            >
               <h3 class="text-lg font-bold text-foreground group-hover:text-cyan-500 transition-colors">
                 {{ doc.name }}
               </h3>
               
               <!-- Tampilan Breadcrumb agar user tahu ini ada di mana -->
               <div class="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                 <Layers class="w-3.5 h-3.5 opacity-70" />
                 <span>{{ doc.path }}</span>
               </div>
            </div>
         </div>
      </div>

      <!-- ===== TAMPILAN NORMAL (TIDAK MENCARI) ===== -->
      <div v-else class="animate-in fade-in duration-300">
        <div v-if="activeContent" class="mb-6 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
          <span>Docs</span> <span class="text-border">/</span>
          <span>{{ activeContent.category || 'Documentation' }}</span> <span class="text-border">/</span>
          <span class="text-foreground font-medium">{{ activeContent.title }}</span>
        </div>

        <DocsContent 
          :data="activeContent" 
          @smartNavigate="handleSmartRouting" 
        />
      </div>
    </main>

    <!-- Sidebar Kanan (Table of Content) -->
    <!-- TOC kita sembunyikan jika sedang dalam mode pencarian, karena strukturnya jadi tidak relevan -->
    <DocsSidebarRight 
      v-if="!props.searchQuery"
      class="hidden xl:block"
      :headings="tocHeadings" 
      :active-id="activeHeadingId" 
      @scroll-to="scrollToHeading" 
    />

  </div>
</template>