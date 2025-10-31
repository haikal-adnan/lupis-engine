<template>
  <div
    :role="'separator'"
    :aria-orientation="axis === 'x' ? 'vertical' : 'horizontal'"
    class="group relative select-none touch-none z-20"
    :class="axis === 'x' ? 'cursor-col-resize' : 'cursor-row-resize'"
    :style="styleObj"
    @pointerdown="onDown"
  >
    <!-- garis tipis; visual muncul hanya saat hover -->
    <div
      class="absolute inset-0 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      :class="axis === 'x' ? 'bg-white/20' : 'bg-white/20'"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  axis: { type: String, default: "x" },            // 'x' (vertikal) atau 'y' (horizontal)
  onDrag: { type: Function, required: true },      // ({clientX, clientY}) => void
  thickness: { type: Number, default: 3 },         // px: lebar/tinggi handle (kecil)
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
