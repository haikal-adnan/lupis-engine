<template>
  <header class="h-12 px-4 flex items-center justify-between card">
    <!-- Kiri: Logo + Judul + Grup ikon -->
    <div class="flex items-center gap-3">
      <!-- Logo + Judul (punya background) -->
      <div class="flex items-center gap-2 bg-white/10 rounded-md px-2 py-1">
        <div class="flex items-center justify-center w-4 h-6 rounded-md">
          <img
            src="@/assets/icons/ic_folder_open.svg"
            alt="logo"
            class="w-3.5 h-3.5 icon-white"
          />
        </div>
        <div class="font-semibold text-sm text-white/90">
          <slot name="title">New Project</slot>
        </div>
      </div>

      <!-- Garis pemisah -->
      <div class="w-px h-5 bg-white/20"></div>

      <!-- Grup ikon kiri (3 ikon) -->
      <div class="flex items-center gap-2">
        <button class="p-1.5 hover:bg-white/10 rounded-md transition">
          <img src="@/assets/icons/ic_play.svg" class="w-4 h-4 icon-white" />
        </button>
        <button class="p-1.5 hover:bg-white/10 rounded-md transition">
          <img src="@/assets/icons/ic_pause.svg" class="w-4 h-4 icon-white" />
        </button>
        <button class="p-1.5 hover:bg-white/10 rounded-md transition">
          <img src="@/assets/icons/ic_save.svg" class="w-4 h-4 icon-white" />
        </button>
      </div>

      <!-- Garis pemisah -->
      <div class="w-px h-5 bg-white/20"></div>

      <!-- Grup ikon kanan (3 ikon) -->
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

    <!-- Kanan: Dua ikon ujung -->
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
// Tidak perlu import icon — semua dari src/assets/icons/
</script>

