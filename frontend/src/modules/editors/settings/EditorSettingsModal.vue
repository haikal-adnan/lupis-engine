<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
      enter-to-class="opacity-100 translate-y-0 sm:scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 sm:scale-100"
      leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    >
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6"
        @mousedown="onOutsideMouseDown"
        @mouseup="onOutsideMouseUp"
      >
        <div 
          class="w-full max-w-[900px] h-[650px] bg-background border border-border rounded-xl shadow-2xl flex relative overflow-hidden" 
          @mousedown.stop
        >
          <SettingsSidebar 
            :tabs="TABS" 
            v-model:active="activeTab" 
          />

          <SettingsContent 
            :active-tab-info="currentTabInfo" 
            :active-tab-id="activeTab"
            @close="closeModal" 
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Activity, Wind, Grid3X3, FolderSync, Database, BugPlay, Box } from 'lucide-vue-next';

import SettingsSidebar from '@editors/settings/components/SettingsSidebar.vue';
import SettingsContent from '@editors/settings/components/SettingsContent.vue';

const props = defineProps({ isOpen: Boolean });
const emit = defineEmits(['close']);

const TABS = [
  { id: 'project', label: 'Project Info', icon: FolderSync, desc: 'Identitas proyek dan konfigurasi penyimpanan otomatis.' },
  { id: 'engine', label: 'Engine & Canvas', icon: Activity, desc: 'Konfigurasi dasar putaran game dan resolusi tampilan.' },
  { id: 'physics', label: 'Physics & Bounds', icon: Wind, desc: 'Konfigurasi gaya tarik, hambatan, dan batas area.' },
  { id: 'grid', label: 'Grid & Camera', icon: Grid3X3, desc: 'Panduan visual editor dan sudut pandang kamera.' },
  { id: 'resources', label: 'Resources', icon: Database, desc: 'Pengaturan global untuk aset, kompresi, dan audio.' },
  { id: 'debug', label: 'Debugging', icon: BugPlay, desc: 'Alat bantu visual untuk mengukur performa game.' },
  { id: 'publish', label: 'Publish & Export', icon: Box, desc: 'Kompilasi proyek menjadi aplikasi mandiri.' }
];

const activeTab = ref('engine');
const currentTabInfo = computed(() => TABS.find(t => t.id === activeTab.value) || TABS[0]);

const isMouseDownOutside = ref(false);
const onOutsideMouseDown = (e) => isMouseDownOutside.value = e.target === e.currentTarget;
const onOutsideMouseUp = (e) => {
  if (isMouseDownOutside.value && e.target === e.currentTarget) closeModal();
  isMouseDownOutside.value = false;
};

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && props.isOpen) closeModal();
};

const closeModal = () => emit('close');

onMounted(() => window.addEventListener('keydown', handleKeyDown));
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));
</script>