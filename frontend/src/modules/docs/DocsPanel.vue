<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // <-- Tambahkan import Vue Router
import { useDocsLogic } from '@/modules/docs/composables/useDocsLogic';
import DocsSidebarLeft from '@/modules/docs/views/DocsSidebarLeft.vue';
import DocsSidebarRight from '@/modules/docs/views/DocsSidebarRight.vue';
import DocsContent from '@/modules/docs/views/DocsContent.vue';
import { Menu } from 'lucide-vue-next';

const route = useRoute();   // <-- Inisialisasi route
const router = useRouter(); // <-- Inisialisasi router

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
  changeDocument     
} = useDocsLogic();

const isMobileSidebarOpen = ref(false);

// --- BAGIAN BARU: Sinkronisasi URL dengan Konten ---
watch(() => route.params.docPath, (newPath) => {
  if (newPath) {
    // Gabungkan array segment URL (jika ada) menjadi satu string path
    const pathId = Array.isArray(newPath) ? newPath.join('/') : newPath;
    
    // Panggil fungsi ganti dokumen jika path di URL berbeda dengan state saat ini
    if (pathId !== currentDocId.value) {
      changeDocument(pathId);
    }
  }
}, { immediate: true }); // immediate: true agar langsung berjalan saat komponen di-mount

// Fungsi baru untuk Sidebar: Ganti dokumen + Ubah URL
const navigateAndPush = (docId) => {
  if (docId !== currentDocId.value) {
    router.push({ path: `/docs/${docId}` }); // Ubah URL
    changeDocument(docId); // Muat data JSON
  }
};
// ---------------------------------------------------

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
    // Update URL saat smart routing beda dokumen
    router.push({ path: `/docs/${docId}`, hash: sectionId ? `#${sectionId}` : '' });
    await changeDocument(docId); 
    
    if (sectionId) {
      setTimeout(() => {
        scrollToHeading(sectionId);
      }, 100); 
    }
  } 
  else if (sectionId) {
    // Update URL hash jika hanya lompat ke section di halaman yang sama
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
      :is-open="isMobileSidebarOpen"
      @close="isMobileSidebarOpen = false"
      @navigate="navigateAndPush" 
    />

    <main class="flex-1 min-w-0 min-h-screen px-4 py-4 lg:py-8 lg:px-12 xl:pr-8 xl:pl-12 pb-24 w-full" ref="contentContainer">
      <div v-if="activeContent" class="mb-6 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
        <span>Docs</span> <span class="text-border">/</span>
        <span>{{ activeContent.category || 'Documentation' }}</span> <span class="text-border">/</span>
        <span class="text-foreground font-medium">{{ activeContent.title }}</span>
      </div>

      <DocsContent 
        :data="activeContent" 
        @smartNavigate="handleSmartRouting" 
      />
    </main>

    <DocsSidebarRight 
      class="hidden xl:block"
      :headings="tocHeadings" 
      :active-id="activeHeadingId" 
      @scroll-to="scrollToHeading" 
    />

  </div>
</template>