<!-- components/layout/ResizeHandle.vue -->

<template>
  <div
    :role="'separator'"
    :aria-orientation="axis === 'x' ? 'vertical' : 'horizontal'"
    class="group relative select-none touch-none z-20"
    :class="axis === 'x' ? 'cursor-col-resize' : 'cursor-row-resize'"
    :style="styleObj"
    @pointerdown="onDown"
  >
    <div
      class="absolute inset-0 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      :class="axis === 'x' ? 'bg-white/20' : 'bg-white/20'"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  axis: { type: String, default: "x" },           
  onDrag: { type: Function, required: true },      
  thickness: { type: Number, default: 3 },       
});

const styleObj = computed(() => (
  props.axis === "x"
    ? { width: `${props.thickness}px`, height: "100%" }
    : { height: `${props.thickness}px`, width: "100%" }
));

function onDown(e) {
  e.preventDefault();
  const move = (ev) => props.onDrag({ clientX: ev.clientX, clientY: ev.clientY });
  const up   = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up, { once: true });
}
</script>
