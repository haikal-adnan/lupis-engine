<script setup>
import { ref, computed, onMounted } from 'vue';
import { Folder, FileText, ChevronRight, RefreshCw, FolderSearch } from 'lucide-vue-next';
import { useProjectActions } from '@projects/projects.js';

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
});

const projects = ref([]);
const isLoading = ref(true);

const { getProjectsByOwnerId } = useProjectActions();

const loadProjects = async () => {
  isLoading.value = true;
  try {
    const data = await getProjectsByOwnerId();
    projects.value = data || [];
  } catch (error) {
    console.error('Gagal mengambil daftar proyek dari OPFS:', error);
    projects.value = [];
  } finally {
    isLoading.value = false;
  }
};

const filteredProjects = computed(() => {
  if (!props.searchQuery) return projects.value;
  const query = props.searchQuery.toLowerCase();
  return projects.value.filter(
    (p) =>
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query))
  );
});

onMounted(() => {
  loadProjects();
});
</script>

<template>
  <div class="flex-1 max-w-[1400px] mx-auto w-full px-4 lg:px-6 py-8 font-sans">
    
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Eksplorasi Proyek</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Daftar proyek Lupis Engine yang tersimpan secara lokal di OPFS browser Anda
        </p>
      </div>

      <button 
        @click="loadProjects"
        :disabled="isLoading"
        class="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors w-fit disabled:opacity-50"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
        Refresh OPFS
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>

    <!-- Empty State -->
    <div 
      v-else-if="filteredProjects.length === 0" 
      class="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-card/50"
    >
      <FolderSearch class="w-12 h-12 text-muted-foreground/40 mb-3" />
      <h3 class="text-base font-semibold text-foreground">Tidak Ada Proyek Ditemukan</h3>
      <p class="text-xs text-muted-foreground mt-1 max-w-sm">
        Belum ada proyek yang tersimpan di OPFS atau pencarian tidak cocok.
      </p>
    </div>

    <!-- Grid List Proyek (Tanpa Thumbnail) -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <router-link 
        v-for="project in filteredProjects" 
        :key="project.id" 
        :to="`/play/${project.id}`"
        class="group flex flex-col justify-between bg-card p-5 rounded-xl border border-border hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
      >
        <div>
          <!-- Header Card: Icon & Nama Proyek -->
          <div class="flex items-start gap-3 mb-2">
            <div class="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-500 shrink-0 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
              <Folder class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="text-base font-bold text-foreground leading-snug group-hover:text-cyan-500 transition-colors truncate">
                {{ project.name || 'Untitled Project' }}
              </h2>
              <span class="text-[10px] font-mono text-muted-foreground truncate block">
                ID: {{ project.id }}
              </span>
            </div>
          </div>

          <!-- Deskripsi Proyek -->
          <p class="text-xs text-muted-foreground line-clamp-3 mt-3 leading-relaxed">
            {{ project.description || 'Tidak ada deskripsi proyek.' }}
          </p>
        </div>

        <!-- Footer Card -->
        <div class="mt-5 pt-3 border-t border-border flex items-center justify-between">
          <span class="text-[11px] text-muted-foreground flex items-center gap-1">
            <FileText class="w-3.5 h-3.5" /> OPFS
          </span>
          <span class="text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
            Buka <ChevronRight class="w-3.5 h-3.5" />
          </span>
        </div>
      </router-link>
    </div>

  </div>
</template>