<template>
  <div class="w-full h-full card p-0 overflow-hidden flex flex-col !rounded-b-none !rounded-t-md">
    <!-- Top bar -->
    <div class="card flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 select-none !rounded-t-md !rounded-b-none">
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

    <!-- Engine canvas -->
    <div ref="stage" class="relative flex-1 bg-slate-800 !rounded-b-md overflow-hidden">
      <canvas id="glCanvas" class="absolute inset-0 w-full h-full z-0"></canvas>
      <canvas id="uiCanvas" class="absolute inset-0 w-full h-full z-10 pointer-events-none"></canvas>
    </div>
  </div>
</template>

<script setup>
import { onMounted, nextTick } from "vue";
import { main } from "../../../projects/template-platformer/code/Main.js";

onMounted(async () => {
  await nextTick();
  await main();
});
</script>
