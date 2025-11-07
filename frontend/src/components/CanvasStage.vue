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

    <!-- Engine canvas -->
    <div ref="stage" class="relative flex-1 bg-slate-800 !rounded-b-md overflow-hidden">
      <canvas id="glCanvas" class="absolute inset-0 w-full h-full z-0"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from "vue";
import { main } from "../../../projects/template-platformer/code/Main.js";

const previewWindow = ref(null);

// Jalankan engine dalam editor
onMounted(async () => {
  await nextTick();
  await main("glCanvas");
});

// Bersihkan popup jika ditutup manual
window.addEventListener("focus", () => {
  if (previewWindow.value && previewWindow.value.closed) previewWindow.value = null;
});

onBeforeUnmount(() => {
  if (previewWindow.value && !previewWindow.value.closed) previewWindow.value.close();
});

// === 🔹 Buka popup ke preview.html tanpa backend ===
function openOrUpdatePreview() {
  const projectId = "template-platformer";

  if (previewWindow.value && !previewWindow.value.closed) {
    // Kirim sinyal reload
    previewWindow.value.postMessage({ type: "reloadGame" }, "*");
    console.log("🔄 Reload dikirim ke popup preview");
    return;
  }

  // Buat URL preview statis (tanpa backend)
  const previewUrl = `/preview/preview.html?project=${projectId}`;

  // Popup config
  const w = 960, h = 540;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  const features = `
    popup=yes,
    width=${w},
    height=${h},
    left=${left},
    top=${top},
    resizable=yes,
    scrollbars=no,
    status=no,
    menubar=no,
    toolbar=no
  `.replace(/\s+/g, "");

  previewWindow.value = window.open(previewUrl, "LupisPreview", features);
  console.log("🎮 Popup preview dibuka:", previewUrl);
}
</script>

<style scoped>
.card {
  color: white;
}
</style>
