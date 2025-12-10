<template>
  <header class="h-12 px-4 flex items-center justify-between bg-panel border-b border-border transition-colors duration-200">
    
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 bg-element hover:bg-element-hover rounded-md px-2 py-1.5 transition-colors cursor-pointer border border-transparent hover:border-border group">
        <IconFolderOpen class="w-3.5 h-3.5 text-muted group-hover:text-primary transition-colors" />
        <div class="font-semibold text-sm text-primary">
          <slot name="title">New Project</slot>
        </div>
      </div>

      <div class="w-px h-5 bg-border"></div>

      <div class="flex items-center gap-1">
        <button
          class="p-1.5 rounded-md transition-colors"
          :class="mode === 'play' 
            ? 'bg-action text-action-text shadow-sm'   /* AKTIF: Bg Hitam/Putih, Icon Putih/Hitam */
            : 'text-secondary hover:bg-element-hover hover:text-primary' /* NON-AKTIF */
          "
          title="Play"
          @click="setMode('play')"
        >
          <IconPlay class="w-4 h-4" />
        </button>

        <button
          class="p-1.5 rounded-md transition-colors"
          :class="mode === 'pause' 
            ? 'bg-action text-action-text shadow-sm' 
            : 'text-secondary hover:bg-element-hover hover:text-primary'
          "
          title="Pause"
          @click="setMode('pause')"
        >
          <IconPause class="w-4 h-4" />
        </button>

        <button
          class="p-1.5 text-secondary hover:text-primary hover:bg-element-hover rounded-md transition-colors"
          title="Restart Engine"
          @click="restartEngine"
        >
          <IconSave class="w-4 h-4" />
        </button>
      </div>

      <div class="w-px h-5 bg-border"></div>
    </div>

    <div class="flex items-center gap-2">
      <button 
        class="p-1.5 text-secondary hover:text-primary hover:bg-element-hover rounded-md transition-colors" 
        @click="toggleTheme"
        title="Toggle Theme"
      >
        <component 
          :is="isDark ? IconModeLight : IconModeDark" 
          class="w-4 h-4" 
        />
      </button>

      <button class="p-1.5 text-secondary hover:text-primary hover:bg-element-hover rounded-md transition-colors">
        <IconSetting class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Config from "@engine/Core/Config.js";
import { econsole } from "@engine/Util/EngineConsole.js";
import { startEngine } from "@engine/main.js";

// --- IMPORT ICONS AS COMPONENTS ---
import IconFolderOpen from "@/assets/icons/ic_folder_open.svg?component";
import IconPlay from "@/assets/icons/ic_play.svg?component";
import IconPause from "@/assets/icons/ic_pause.svg?component";
import IconSave from "@/assets/icons/ic_save.svg?component";
import IconModeDark from "@/assets/icons/ic_mode_dark.svg?component";
import IconModeLight from "@/assets/icons/ic_mode_light.svg?component";
import IconSetting from "@/assets/icons/ic_setting.svg?component";

const mode = ref(Config.ENGINE_MODE);
const isDark = ref(false);

function applyTheme() {
  const html = document.documentElement;
  if (isDark.value) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}

function toggleTheme() {
  isDark.value = !isDark.value;
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
  applyTheme();
}

onMounted(() => {
  const saved = localStorage.getItem("theme");
  if (saved) {
    isDark.value = saved === "dark";
  } else {
    isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  applyTheme();
});

function setMode(value) {
  if (value !== mode.value) {
    mode.value = value;
    Config.ENGINE_MODE = value;
    econsole.log(`🎮 Engine mode now "${value.toUpperCase()}"`);
  }
}

async function restartEngine() {
  econsole.log("🔄 Restarting editor engine...");
  Config.ENGINE_MODE = "pause";
  await new Promise(r => r(100));
  try {
    await startEngine("glCanvas", "editor", "/projects/ProjectTemplate/");
    econsole.log("✅ Editor engine restarted successfully");
    mode.value = "play";
  } catch (err) {
    econsole.error("❌ Restart failed:", err);
  }
}
</script>