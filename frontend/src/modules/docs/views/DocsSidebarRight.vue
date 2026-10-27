<script setup>
defineProps({
  headings: {
    type: Array,
    default: () => [] 
  },
  activeId: {
    type: String,
    default: ''
  }
});

defineEmits(['scrollTo']);
</script>

<template>
  <aside class="hidden xl:block w-56 shrink-0 h-[calc(100vh-4rem)] sticky top-16 py-8 pl-4">
    
    <div v-if="headings.length > 0">
      <div class="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">On this page</div>
      
      <nav class="border-l border-border">
        <ul class="space-y-2">
          <li v-for="heading in headings" :key="heading.id">
            <button 
              @click="$emit('scrollTo', heading.id)"
              class="w-full text-left block py-1 text-sm transition-colors relative border-l-2 -ml-[1px] cursor-pointer"
              :class="[
                heading.level === 3 ? 'pl-6' : 'pl-4',
                activeId === heading.id 
                  ? 'border-cyan-500 text-cyan-500 font-medium' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              ]"
            >
              {{ heading.text }}
            </button>
          </li>
        </ul>
      </nav>
    </div>
    
  </aside>
</template>