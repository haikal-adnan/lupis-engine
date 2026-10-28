<script setup>
import { ref, watch, nextTick, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router'; 
import { useDocsLogic, DocsSidebarLeft, DocsSidebarRight, DocsContent } from '@docs/docs.js';
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
  currentLang,
  availableLanguages,
  setLanguage,
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

watch(
  () => [route.params.lang, route.params.docPath, route.hash],
  async ([newLang, newPath, newHash]) => {
    if (newLang === 'en' || newLang === 'id') {
      if (newLang !== currentLang.value) {
        await setLanguage(newLang);
      }
    }

    if (newPath) {
      const pathId = Array.isArray(newPath) ? newPath.join('/') : newPath;
      if (pathId && pathId !== currentDocId.value) {
        await changeDocument(pathId);
      }
    }

    if (newHash) {
      const sectionId = newHash.replace('#', '');
      setTimeout(() => {
        scrollToHeading(sectionId);
      }, 150);
    }
  },
  { immediate: true }
);

const onLanguageChange = async (newLang) => {
  if (newLang !== 'en' && newLang !== 'id') return;
  if (newLang === currentLang.value) return;
  await setLanguage(newLang);
  router.push({
    path: `/docs/${newLang}/${currentDocId.value}`,
    hash: route.hash || ''
  });
};

const navigateAndPush = (docId) => {
  if (docId.includes('#')) {
    handleSmartRouting(docId);
    return;
  }
  const targetLang = currentLang.value || 'en';
  if (docId !== currentDocId.value) {
    router.push({ path: `/docs/${targetLang}/${docId}` }); 
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
  let [docId, sectionId] = url.split('#');
  let targetLang = currentLang.value || 'en';

  if (docId.startsWith('id/')) {
    targetLang = 'id';
    docId = docId.slice(3);
  } else if (docId.startsWith('en/')) {
    targetLang = 'en';
    docId = docId.slice(3);
  }

  if (docId && docId !== currentDocId.value) {
    router.push({ 
      path: `/docs/${targetLang}/${docId}`, 
      hash: sectionId ? `#${sectionId}` : '' 
    });
    if (targetLang !== currentLang.value) {
      await setLanguage(targetLang);
    }
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
      :current-doc-id="currentDocId"
      :current-lang="currentLang"
      :languages="availableLanguages"
      :is-open="isMobileSidebarOpen"
      @close="isMobileSidebarOpen = false"
      @navigate="navigateAndPush" 
      @change-language="onLanguageChange"
    />

    <main class="flex-1 min-w-0 min-h-screen px-4 py-4 lg:py-8 lg:px-12 xl:pr-8 xl:pl-12 pb-24 w-full relative" ref="contentContainer">
      
      <div v-if="props.searchQuery" class="w-full">
         <h2 class="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Search class="w-6 h-6 text-cyan-500" />
            Documentation Search: <span class="text-cyan-500">"{{ props.searchQuery }}"</span>
         </h2>

         <div v-if="searchResults.length === 0" class="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-xl border border-border border-dashed">
            <Box class="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p class="text-lg font-medium text-foreground">No documentation found</p>
            <p class="text-sm text-muted-foreground mt-1">Try searching for a different keyword or check your spelling.</p>
         </div>

         <div v-else class="grid grid-cols-1 gap-3">
            <div
              v-for="doc in searchResults"
              :key="doc.id"
              @click="navigateAndPush(doc.id)"
              class="group flex flex-col p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-cyan-500/50 hover:shadow-lg transition-all"
            >
               <h3 class="text-lg font-bold text-foreground group-hover:text-cyan-500 transition-colors">
                 {{ doc.name }}
               </h3>
               
               <div class="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                 <Layers class="w-3.5 h-3.5 opacity-70" />
                 <span>{{ doc.path }}</span>
               </div>
            </div>
         </div>
      </div>

      <div v-else>
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

    <DocsSidebarRight 
      v-if="!props.searchQuery"
      class="hidden xl:block"
      :headings="tocHeadings" 
      :active-id="activeHeadingId" 
      :current-lang="currentLang"
      @scroll-to="scrollToHeading" 
    />

  </div>
</template>
