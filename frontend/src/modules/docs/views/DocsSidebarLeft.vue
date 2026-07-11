<script setup>
import { ref } from 'vue';
import { ChevronDown, X } from 'lucide-vue-next';
import DocsSidebarItem from '@/modules/docs/components/DocsSidebarItem.vue'; 

const props = defineProps({
  navItems: {
    type: Array,
    required: true
  },
  currentDocId: {
    type: String,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'navigate']);

const openMenus = ref(props.navItems.map((_, index) => index));

const toggleMenu = (index) => {
  if (openMenus.value.includes(index)) {
    openMenus.value = openMenus.value.filter(i => i !== index);
  } else {
    openMenus.value.push(index);
  }
};

const handleNavigation = (id) => {
  emit('navigate', id);
  emit('close'); 
};
</script>

<template>
  <transition
    enter-active-class="transition-opacity ease-linear duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity ease-linear duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="isOpen" 
      @click="emit('close')" 
      class="fixed inset-0 bg-background z-40 lg:hidden"
    ></div>
  </transition>

  <aside 
    class="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:w-64 lg:shrink-0 lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 overflow-y-auto py-6 lg:py-8 px-4 lg:px-0 lg:pr-6 custom-scrollbar"
    :class="isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'"
  >
    
    <div class="flex items-center justify-between mb-6 lg:hidden px-2">
      <span class="font-bold text-lg text-foreground">Navigation</span>
      <button 
        @click="emit('close')" 
        class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <nav class="space-y-4">
      <div v-for="(section, index) in navItems" :key="index">
        
        <button 
          @click="toggleMenu(index)"
          class="w-full flex items-center justify-between mb-1 py-1 text-sm font-semibold text-foreground hover:text-cyan-500 transition-colors group cursor-pointer"
        >
          <div class="flex items-center gap-2">
            <component :is="section.icon" class="w-4 h-4 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
            {{ section.title }}
          </div>
          
          <ChevronDown 
            v-if="section.links.length > 0"
            class="w-4 h-4 text-muted-foreground transition-transform duration-200"
            :class="{ '-rotate-90': !openMenus.includes(index) }"
          />
        </button>

        <ul 
          v-show="openMenus.includes(index) && section.links.length" 
          class="space-y-1 border-l border-border ml-2 pl-4 mt-2 mb-4"
        >
          <DocsSidebarItem 
            v-for="link in section.links" 
            :key="link.id || link.name"
            :item="link"
            :current-doc-id="currentDocId"
            @navigate="handleNavigation"
          />
        </ul>

      </div>
    </nav>
  </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #cbd5e1; }
</style>