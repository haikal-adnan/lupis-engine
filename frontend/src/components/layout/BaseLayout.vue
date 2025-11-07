<template>
  <!-- 5 kolom: left | HX | center | HX | right -->
  <div
    ref="root"
    class="grid p-2 h-full w-full"
    :style="[layoutVars, {
      columnGap: 'var(--gap-x)',
      rowGap: 'var(--gap-footer)',
      gridTemplateRows: `auto 1fr var(--footer-h)`,
      gridTemplateColumns: `var(--left-w) var(--hx) 1fr var(--hx) var(--right-w)`,
      '--left-w': leftCSS,
      '--right-w': rightCSS,
      '--footer-h': footerCSS
    }]"
  >
    <!-- Topbar -->
    <div class="col-span-5">
      <Topbar />
    </div>

    <!-- Left Sidebar -->
    <Sidebar :style="[rowMainMargin, { minWidth: 'var(--min-left)' }]">
      <h3 class="font-semibold mb-3 text-white">File System</h3>
      <div class="flex flex-col space-y-5 text-sm">
        <FileExplorer />
      </div>
    </Sidebar>

    <!-- Handle Left | Center -->
    <ResizeHandle axis="x" :onDrag="dragLeft" :thickness="LAYOUT.HANDLE_X" :style="rowMainMargin" />

    <!-- Center (Canvas) -->
    <CanvasStage :style="rowMainMargin" />

    <!-- Handle Center | Right -->
    <ResizeHandle axis="x" :onDrag="dragRight" :thickness="LAYOUT.HANDLE_X" :style="rowMainMargin" />

    <!-- Right Sidebar -->
    <Sidebar :style="[rowMainMargin, { minWidth: 'var(--min-right)' }]">
      <h3 class="font-semibold mb-3 text-white">Property Inspector</h3>
      <div class="flex flex-col space-y-5 text-sm">
        <Property />
      </div>
    </Sidebar>

    <!-- Footer -->
    <div class="relative col-span-5">
      <ResizeHandle
        axis="y"
        :onDrag="dragFooter"
        :thickness="LAYOUT.GAP_FOOTER"
        class="absolute inset-x-0 top-0 -translate-y-1/2 z-20"
        @pointerdown.stop
      />

      <FooterBar class="h-full flex flex-col bg-black/40 rounded-t-md border-t border-white/10">
        <!-- Tabs -->
        <div class="flex items-center gap-3 px-3 py-1.5 border-b border-white/10">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all"
            :class="[
              activeTab === tab.key
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            ]"
          >
            <img
              :src="tab.icon"
              class="w-4 h-4 filter invert brightness-200"
              :class="[activeTab === tab.key ? 'opacity-100' : 'opacity-60']"
            />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- Konten aktif -->
        <div class="flex-1 overflow-auto">
          <!-- Saat tab asset, kirim daftar ekstensi langsung -->
          <component
            :is="activeComponent"
            v-if="activeTab === 'asset'"
            :extensions="allExtensions"
          />
          <component
            :is="activeComponent"
            v-else
          />
        </div>
      </FooterBar>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { clamp } from "../../composables/useClamp";

// Komponen layout utama
import Topbar from "./Topbar.vue";
import Sidebar from "./Sidebar.vue";
import FooterBar from "./FooterBar.vue";
import ResizeHandle from "./ResizeHandle.vue";
import CanvasStage from "../CanvasStage.vue";
import FileExplorer from "../system/FileExplorer.vue";

// Footer Tabs
import AssetManagement from "../management/AssetManagement.vue";
import ConsoleView from "../console/ConsoleView.vue";
import icImage from "@/assets/icons/ic_image.svg";
import icCode from "@/assets/icons/ic_code.svg";
import Property from "../inspector/Property.vue";

/* === Layout Config === */
const LAYOUT = Object.freeze({
  GAP_X: 2,
  GAP_TOP: 6,
  GAP_FOOTER: 4,
  HANDLE_X: 3,
  PAD_FALLBACK: 8,
  MIN_LEFT_PX: 180,
  MIN_RIGHT_PX: 220,
  MIN_CENTER_PX: 320,
  MIN_LEFT_PCT: 0.10,
  MIN_RIGHT_PCT: 0.10,
  MIN_MAIN_W_PCT: 0.30,
  MIN_MAIN_H_PCT: 0.30,
  MIN_FOOTER_PCT: 0.10,
  MAX_FOOTER_PCT: 0.60,
  INIT_LEFT_PCT: 0.20,
  INIT_RIGHT_PCT: 0.26,
  INIT_FOOTER_PCT: 0.22,
});

const root = ref(null);
const leftPct = ref(LAYOUT.INIT_LEFT_PCT);
const rightPct = ref(LAYOUT.INIT_RIGHT_PCT);
const footerPct = ref(LAYOUT.INIT_FOOTER_PCT);

const layoutVars = computed(() => ({
  '--gap-x': `${LAYOUT.GAP_X}px`,
  '--gap-top': `${LAYOUT.GAP_TOP}px`,
  '--gap-footer': `${LAYOUT.GAP_FOOTER}px`,
  '--hx': `${LAYOUT.HANDLE_X}px`,
  '--min-left': `${LAYOUT.MIN_LEFT_PX}px`,
  '--min-right': `${LAYOUT.MIN_RIGHT_PX}px`
}));

const leftCSS = computed(() => `${(leftPct.value * 100).toFixed(2)}vw`);
const rightCSS = computed(() => `${(rightPct.value * 100).toFixed(2)}vw`);
const footerCSS = computed(() => `${(footerPct.value * 100).toFixed(2)}vh`);

const rowMainMargin = computed(() => {
  const diff = Math.max(0, LAYOUT.GAP_TOP - LAYOUT.GAP_FOOTER);
  return { marginTop: `${diff}px` };
});

/* === Resize Handlers === */
function getContentGeom() {
  const el = root.value;
  if (!el) {
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const pad = LAYOUT.PAD_FALLBACK;
    return { rectLeft: 0, contentW: Math.max(0, vw - pad - pad), padL: pad };
  }
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  return { rectLeft: rect.left, contentW: Math.max(0, rect.width - padL - padR), padL };
}

function dragLeft({ clientX }) {
  const { rectLeft, contentW, padL } = getContentGeom();
  const x = clientX - rectLeft - padL;
  const candidatePx = x - (LAYOUT.HANDLE_X * 0.5) - LAYOUT.GAP_X;
  const minLeftPctFromPx = LAYOUT.MIN_LEFT_PX / contentW;
  const minLeftPct = Math.max(LAYOUT.MIN_LEFT_PCT, minLeftPctFromPx);
  const rightPx = rightPct.value * contentW;
  const minCenterPx = Math.max(LAYOUT.MIN_MAIN_W_PCT * contentW, LAYOUT.MIN_CENTER_PX);
  const maxLeftPx = contentW - rightPx - (2 * LAYOUT.HANDLE_X) - (4 * LAYOUT.GAP_X) - minCenterPx;
  const leftPx = clamp(candidatePx, minLeftPct * contentW, Math.max(minLeftPct * contentW, maxLeftPx));
  leftPct.value = clamp(leftPx / contentW, minLeftPct, 1);
}

function dragRight({ clientX }) {
  const { rectLeft, contentW, padL } = getContentGeom();
  const x = clientX - rectLeft - padL;
  const candidatePx = (contentW - x) - (LAYOUT.HANDLE_X * 0.5) - LAYOUT.GAP_X;
  const minRightPctFromPx = LAYOUT.MIN_RIGHT_PX / contentW;
  const minRightPct = Math.max(LAYOUT.MIN_RIGHT_PCT, minRightPctFromPx);
  const leftPx = leftPct.value * contentW;
  const minCenterPx = Math.max(LAYOUT.MIN_MAIN_W_PCT * contentW, LAYOUT.MIN_CENTER_PX);
  const maxRightPx = contentW - leftPx - (2 * LAYOUT.HANDLE_X) - (4 * LAYOUT.GAP_X) - minCenterPx;
  const rightPx = clamp(candidatePx, minRightPct * contentW, Math.max(minRightPct * contentW, maxRightPx));
  rightPct.value = clamp(rightPx / contentW, minRightPct, 1);
}

function dragFooter({ clientY }) {
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const maxFooter = Math.min(LAYOUT.MAX_FOOTER_PCT, 1 - LAYOUT.MIN_MAIN_H_PCT);
  footerPct.value = clamp((vh - clientY) / vh, LAYOUT.MIN_FOOTER_PCT, maxFooter);
}

/* === Footer Tabs === */
const tabs = [
  { key: "asset", label: "Assets", icon: icImage, component: AssetManagement },
  { key: "console", label: "Console", icon: icCode, component: ConsoleView },
];

const activeTab = ref("console");
const activeComponent = computed(() => {
  const tab = tabs.find((t) => t.key === activeTab.value);
  return tab ? tab.component : null;
});

/* === Filter Ekstensi Otomatis untuk AssetManagement === */
const allExtensions = [".png", ".jpg", ".jpeg", ".svg", ".wav", ".mp3"];
</script>
