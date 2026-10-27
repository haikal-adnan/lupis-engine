<script setup>
defineProps({
  headings: {
    type: Array,
    default: () => [] 
  },
  activeId: {
    type: String,
    default: ''
  },
  currentLang: {
    type: String,
    default: 'en'
  }
});

defineEmits(['scrollTo']);
</script>

<template>
  <aside class="hidden xl:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto py-8 pl-4 pr-2 custom-scrollbar">
    <div v-if="headings.length > 0" class="pb-16">
      <div class="mb-4 text-xs font-bold uppercase tracking-wider text-foreground select-none">
        {{ currentLang === 'id' ? 'Di halaman ini' : 'On this page' }}
      </div>
      
      <nav class="border-l border-border">
        <ul class="space-y-1">
          <li v-for="heading in headings" :key="heading.id">
            <button 
              @click="$emit('scrollTo', heading.id)"
              class="w-full text-left block py-1.5 text-sm transition-colors relative border-l-2 -ml-[1px] cursor-pointer break-words leading-snug"
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

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 0.25);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--muted-foreground) / 0.5);
}
</style>
