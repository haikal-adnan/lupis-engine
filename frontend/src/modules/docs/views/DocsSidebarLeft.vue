<script setup>
import { ref } from 'vue';
import { ChevronDown } from 'lucide-vue-next';

const props = defineProps({
  navItems: {
    type: Array,
    required: true
  }
});

const openMenus = ref(props.navItems.map((_, index) => index));

const toggleMenu = (index) => {
  if (openMenus.value.includes(index)) {
    openMenus.value = openMenus.value.filter(i => i !== index);
  } else {
    openMenus.value.push(index);
  }
};
</script>

<template>
  <aside class="hidden lg:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto py-8 pr-6 border-r border-border custom-scrollbar">
    <nav class="space-y-4">
      <div v-for="(section, index) in navItems" :key="index">
        
        <button 
          @click="toggleMenu(index)"
          class="w-full flex items-center justify-between mb-1 py-1 text-sm font-semibold text-foreground hover:text-indigo-500 transition-colors group"
        >
          <div class="flex items-center gap-2">
            <component :is="section.icon" class="w-4 h-4 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
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
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #cbd5e1; }
</style>