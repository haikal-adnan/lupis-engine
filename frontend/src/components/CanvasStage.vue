<!-- components/CanvasStage.vue -->

<template>
  <div class="w-full h-full card p-0 overflow-hidden flex flex-col !rounded-b-none !rounded-t-md">
    <!-- 🔹 Top bar -->
    <div
      class="card flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 select-none !rounded-t-md !rounded-b-none"
    >
      <!-- Tombol Preview / Update -->
      <button
        @click="openOrUpdatePreview"
        class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition"
        :class="previewWindow && !previewWindow.closed ? 'bg-blue-500/20 hover:bg-blue-500/30' : 'bg-green-500/20 hover:bg-green-500/30'"
      >
        <img
          :src="previewWindow && !previewWindow.closed
              ? '/src/assets/icons/ic_refresh.svg'
              : '/src/assets/icons/ic_play.svg'"
          class="w-4 h-4 filter invert brightness-200"
        />
        <span>{{ previewWindow && !previewWindow.closed ? 'Update' : 'Preview' }}</span>
      </button>

      <!-- Kanan -->
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

    <div ref="stage" class="relative flex-1 bg-slate-800 !rounded-b-md overflow-hidden">
      <canvas id="glCanvas" class="absolute inset-0 w-full h-full z-0"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { startEngine } from "@engine/main.js";

const previewWindow = ref(null);

async function loadProject() {
  const project = await fetch("/projects/ProjectTemplate/project.json").then(r => r.json());
  const scene = await fetch(`/projects/ProjectTemplate/scenes/${project.startScene}.json`).then(r => r.json());

  return { project, scene };
}

async function openOrUpdatePreview() {
  const payload = await loadProject();

  if (previewWindow.value && !previewWindow.value.closed) {
    previewWindow.value.postMessage({
      type: "projectData",
      payload
    }, "*");

    console.log("🔄 Update sent");
    return;
  }

  previewWindow.value = window.open(
    "/preview/preview.html",
    "LupisPreview",
    "width=960,height=540,resizable=yes"
  );

  const check = setInterval(() => {
    if (!previewWindow.value) return;

    previewWindow.value.postMessage({
      type: "projectData",
      payload
    }, "*");

    clearInterval(check);
    console.log("▶ Sent initial project");
  }, 250);
}

onMounted(async () => {
  await nextTick();
  startEngine("glCanvas", "editor", "/projects/ProjectTemplate/");
});
</script>