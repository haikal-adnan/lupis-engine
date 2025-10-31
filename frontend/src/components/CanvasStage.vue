<template>
  <div
    ref="wrap"
    class="w-full h-full card p-0 overflow-hidden flex flex-col !rounded-b-none !rounded-t-md"
  >
    <!-- === Top Bar === -->
    <div
      class="card flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 select-none !rounded-t-md !rounded-b-none"
    >
      <div class="text-sm font-semibold text-white/80">
        Scene: <span class="text-white">Main level</span>
      </div>
      <div class="flex items-center gap-3 text-white/80">
        <button class="p-1.5 hover:bg-white/10 rounded-md" title="Zoom Out">
          <img src="@/assets/icons/ic_zoom_out.svg" class="w-4 h-4 filter invert brightness-200" />
        </button>
        <span class="text-xs font-medium w-10 text-center">100%</span>
        <button class="p-1.5 hover:bg-white/10 rounded-md" title="Zoom In">
          <img src="@/assets/icons/ic_zoom_in.svg" class="w-4 h-4 filter invert brightness-200" />
        </button>
        <div class="w-px h-4 bg-white/20 mx-1"></div>
        <button class="p-1.5 hover:bg-white/10 rounded-md" title="Fullscreen">
          <img src="@/assets/icons/ic_fullscreen.svg" class="w-4 h-4 filter invert brightness-200" />
        </button>
      </div>
    </div>

    <!-- === Engine Canvas Container === -->
    <div ref="stage" class="relative flex-1 bg-slate-800 !rounded-b-md overflow-hidden">
      <canvas id="glCanvas" class="absolute inset-0 w-full h-full z-0"></canvas>
      <canvas id="uiCanvas" class="absolute inset-0 w-full h-full z-10 pointer-events-none"></canvas>
    </div>
  </div>
</template>
<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick } from "vue";
import { startEngine } from "../../../engine/main.js"; // pastikan file ini diekspor

const wrap = ref(null);
const stage = ref(null);
let ro;

function fit() {
  const el = stage.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  // Resize kedua canvas
  ["glCanvas", "uiCanvas"].forEach(id => {
    const c = document.getElementById(id);
    if (!c) return;
    c.width = Math.floor(rect.width * dpr);
    c.height = Math.floor(rect.height * dpr);
    c.style.width = rect.width + "px";
    c.style.height = rect.height + "px";
  });
}

onMounted(async () => {
  await nextTick();
  fit();
  ro = new ResizeObserver(fit);
  ro.observe(stage.value);

  try {
    await startEngine("glCanvas", "uiCanvas");
  } catch (err) {
    console.error("❌ Gagal memuat engine:", err);
  }
});

onBeforeUnmount(() => {
  ro?.disconnect();
});
</script>
