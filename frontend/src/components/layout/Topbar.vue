<template>
  <header class="h-12 px-4 flex items-center justify-between card">
    <div class="flex items-center gap-3">
      <!-- Judul Project -->
      <div class="flex items-center gap-2 bg-white/10 rounded-md px-2 py-1">
        <img src="@/assets/icons/ic_folder_open.svg" class="w-3.5 h-3.5 icon-white" />
        <div class="font-semibold text-sm text-white/90">
          <slot name="title">New Project</slot>
        </div>
      </div>

      <div class="w-px h-5 bg-white/20"></div>

      <!-- ▶️ ⏸️ 🔄 -->
      <div class="flex items-center gap-2">
        <button
          class="p-1.5 rounded-md transition"
          :class="mode === 'play' ? 'opacity-100 bg-white/10' : 'opacity-30'"
          title="Play"
          @click="setMode('play')"
        >
          <img src="@/assets/icons/ic_play.svg" class="w-4 h-4 icon-white" />
        </button>
        <button
          class="p-1.5 rounded-md transition"
          :class="mode === 'pause' ? 'opacity-100 bg-white/10' : 'opacity-30'"
          title="Pause"
          @click="setMode('pause')"
        >
          <img src="@/assets/icons/ic_pause.svg" class="w-4 h-4 icon-white" />
        </button>
        <button
          class="p-1.5 hover:bg-white/10 rounded-md transition"
          title="Restart Engine"
          @click="restartEngine"
        >
          <img src="@/assets/icons/ic_save.svg" class="w-4 h-4 icon-white" />
        </button>
      </div>

      <div class="w-px h-5 bg-white/20"></div>

      <!-- Kumpulan ikon kanan -->
      <div class="flex items-center gap-2">
        <button class="p-1.5 hover:bg-white/10 rounded-md transition">
          <img src="@/assets/icons/ic_cursor.svg" class="w-4 h-4 icon-white" />
        </button>
        <button class="p-1.5 hover:bg-white/10 rounded-md transition">
          <img src="@/assets/icons/ic_camera.svg" class="w-4 h-4 icon-white" />
        </button>
        <button class="p-1.5 hover:bg-white/10 rounded-md transition">
          <img src="@/assets/icons/ic_grid.svg" class="w-4 h-4 icon-white" />
        </button>
      </div>
    </div>

    <!-- Tombol kanan atas -->
    <div class="flex items-center gap-2">
      <button class="p-1.5 hover:bg-white/10 rounded-md transition">
        <img src="@/assets/icons/ic_mode_dark.svg" class="w-4 h-4 icon-white" />
      </button>
      <button class="p-1.5 hover:bg-white/10 rounded-md transition">
        <img src="@/assets/icons/ic_setting.svg" class="w-4 h-4 icon-white" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref } from "vue";
import Config from "@engine/Config/Config.js";
import { econsole } from "@engine/Core/EngineConsole.js";
import { startEngine } from "@engine/main.js";

const mode = ref(Config.ENGINE_MODE);

// ▶️ Play / ⏸️ Pause
function setMode(value) {
  if (value !== mode.value) {
    mode.value = value;
    Config.ENGINE_MODE = value;
    econsole.log(`🎮 Engine mode diubah ke "${value.toUpperCase()}"`);

    if (value === "pause") {
      setTimeout(() => {
        import("@engine/main.js").then(({ game }) => {
          const world = game.world;
          if (!world) return;

          for (const key of Object.keys(world)) {
            const obj = world[key];
            if (obj && typeof obj === "object" && "x" in obj && "y" in obj) {
              if ("prevX" in obj) obj.prevX = obj.x;
              if ("prevY" in obj) obj.prevY = obj.y;
            }
          }
        });
      }, 100);
    }
  }
}


async function restartEngine() {
  econsole.log("🔄 Restarting engine...");

  Config.ENGINE_MODE = "pause";
  await new Promise(r => setTimeout(r, 100));

  try {
    await startEngine();
    econsole.log("✅ Engine berhasil direstart");
    Config.ENGINE_MODE = "play";
    mode.value = "play";
  } catch (err) {
    econsole.error("❌ Gagal merestart engine:", err);
  }
}
</script>
