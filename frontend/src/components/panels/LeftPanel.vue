<script setup>
import ScenePanel from '@/components/panels/Scene/ScenePanel.vue';

defineProps({
  collapsed: Boolean
});

defineEmits(['toggle']);
</script>

<template>
  <div
    class="
      h-full flex flex-col
      bg-editor-sidebar
      overflow-hidden
      border-r border-border
    "
  >
    <div
      v-if="!collapsed"
      class="
        h-10 shrink-0
        flex items-center justify-between
        px-2
        border-b border-border
        bg-muted/40
        backdrop-blur-sm
      "
    >
      <h3
        class="
          pl-1
          text-sm
          font-bold
          uppercase
          tracking-wide
          text-foreground/90
        "
      >
        Scene Graph
      </h3>

      <button
        @click="$emit('toggle')"
        class="
          p-1.5 rounded-md
          text-muted-foreground
          hover:text-foreground
          hover:bg-accent/40
          transition-colors
        "
        title="Collapse"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <path d="M9 3v18" />
        </svg>
      </button>
    </div>

    <div
      v-else
      class="
        h-10 shrink-0
        flex items-center justify-center
        border-b border-border
        bg-muted/40
      "
    >
      <button
        @click="$emit('toggle')"
        class="
          p-1.5 rounded-md
          text-foreground
          hover:bg-accent/40
          transition-colors
        "
        title="Expand"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 3h18v18H3z" />
          <path d="M9 3v18" />
          <path d="m15 9-3 3 3 3" />
        </svg>
      </button>
    </div>

    <div
      v-if="!collapsed"
      class="
        flex-1 overflow-hidden
        bg-editor-sidebar
        flex flex-col
      "
    >
      <ScenePanel />
    </div>

    <div
      v-else
      class="
        flex-1 py-4
        flex items-center justify-center
        bg-editor-sidebar
      "
    >
      <div
        class="
          writing-vertical-lr
          text-[11px]
          text-muted-foreground
          tracking-widest
          uppercase
          opacity-60
          select-none
        "
      >
        Scene
      </div>
    </div>
  </div>
</template>

<style scoped>
.writing-vertical-lr {
  writing-mode: vertical-lr;
  text-orientation: mixed;
}
</style>