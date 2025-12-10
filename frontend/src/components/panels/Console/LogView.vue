<!-- components/console -->

<template>
  <div class="p-4 text-white font-mono text-sm bg-black/20 h-full overflow-auto">
    <h3 class="font-semibold text-lg mb-3">Console Log</h3>

    <div v-if="logs.length === 0" class="text-gray-400 text-sm italic">
      Tidak ada log saat ini...
    </div>

    <div v-else class="flex flex-col space-y-1">
      <div
        v-for="(log, i) in logs"
        :key="i"
        class="flex items-center space-x-2"
      >
        <!-- 🔹 Ikon warna via CSS filter -->
        <img
          v-if="log.type === 'log'"
          src="@/assets/icons/ic_warning_rounded.svg"
          alt="log"
          class="w-4 h-4"
          style="filter: invert(48%) sepia(74%) saturate(2471%) hue-rotate(193deg) brightness(97%) contrast(102%);"
        /><img
          v-else-if="log.type === 'warn'"
          src="@/assets/icons/ic_warning_triangle.svg"
          alt="warn"
          class="w-4 h-4"
          style="filter: invert(81%) sepia(58%) saturate(570%) hue-rotate(356deg) brightness(101%) contrast(97%);"
        /><img
          v-else
          src="@/assets/icons/ic_warning_triangle.svg"
          alt="error"
          class="w-4 h-4"
          style="filter: invert(38%) sepia(64%) saturate(5446%) hue-rotate(341deg) brightness(90%) contrast(103%);"
        />

        <span :class="color(log.type)">[{{ formatTime(log.time) }}]</span>
        <span :class="color(log.type)">{{ log.message }}</span>

        <!-- 📁 File sumber log -->
        <span class="text-gray-400 ml-auto text-xs italic">
          ({{ log.source }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { bus } from "@engine/Util/EventBus.js";

const logs = ref([]);

function color(type) {
  switch (type) {
    case "error": return "text-red-400";
    case "warn": return "text-yellow-300";
    default: return "text-blue-400";
  }
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("id-ID");
}

function addLog(entry) {
  logs.value.push(entry);
  if (logs.value.length > 500) logs.value.shift();
}

onMounted(() => {
  bus.on("console:log", addLog);
  bus.on("console:warn", addLog);
  bus.on("console:error", addLog);
  bus.on("console:clear", () => (logs.value = []));
});

onBeforeUnmount(() => {
  bus.off("console:log", addLog);
  bus.off("console:warn", addLog);
  bus.off("console:error", addLog);
});
</script>
