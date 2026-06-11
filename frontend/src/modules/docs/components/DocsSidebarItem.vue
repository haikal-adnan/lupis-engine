<script setup>
import { ref, computed } from 'vue';
import { ChevronDown } from 'lucide-vue-next';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  currentDocId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['navigate']);

const isOpen = ref(true); // Default folder terbuka
const hasChildren = computed(() => props.item.children && props.item.children.length > 0);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const handleNavigate = (id) => {
  emit('navigate', id);
};
</script>

<template>
  <li>
    <div 
      class="w-full flex items-center justify-between py-1.5 text-sm transition-colors rounded-md px-2 -ml-2"
      :class="item.id === currentDocId 
        ? 'text-cyan-500 font-medium bg-cyan-500/5' 
        : 'text-muted-foreground hover:bg-muted/50'"
    >
      <span 
        class="flex-1 cursor-pointer hover:text-foreground"
        @click="item.id ? handleNavigate(item.id) : toggle()"
      >
        {{ item.name }}
      </span>
      
      <button 
        v-if="hasChildren"
        @click.stop="toggle"
        class="p-1 -mr-1 rounded-md hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"
      >
        <ChevronDown 
          class="w-4 h-4 transition-transform duration-200"
          :class="{ '-rotate-90': !isOpen }"
        />
      </button>
    </div>
    
    <ul 
      v-show="isOpen && hasChildren" 
      class="space-y-1 border-l border-border ml-1 pl-3 mt-1"
    >
      <DocsSidebarItem 
        v-for="child in item.children" 
        :key="child.id || child.name" 
        :item="child" 
        :current-doc-id="currentDocId"
        @navigate="handleNavigate"
      />
    </ul>
  </li>
</template>