<template>
  <div class="space-y-8 relative" data-testid="settings-tab-preferences-content">
    <!-- Section: Editor Appearance -->
    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Editor Appearance</h4>
        <p class="text-xs text-muted-foreground mt-0.5">Customize your editor color scheme and workspace theme.</p>
      </div>

      <div class="space-y-4">
        <PropertyRow label="Theme Mode">
          <div class="grid grid-cols-2 gap-4 w-full">
            <!-- Dark Theme Option -->
            <button
              type="button"
              data-testid="theme-option-dark"
              @click="setDarkTheme(true)"
              class="p-4 rounded-xl border text-left transition-all flex flex-col gap-3 group relative cursor-pointer outline-none"
              :class="isDark ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/40 bg-muted/20'"
            >
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Moon class="w-4 h-4 text-blue-400" />
                  <span>Dark Theme</span>
                </div>
                <div 
                  v-if="isDark" 
                  class="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold"
                >
                  ✓
                </div>
              </div>
              <p class="text-xs text-muted-foreground">Deep slate dark color scheme optimized for game development.</p>
            </button>

            <!-- Light Theme Option -->
            <button
              type="button"
              data-testid="theme-option-light"
              @click="setDarkTheme(false)"
              class="p-4 rounded-xl border text-left transition-all flex flex-col gap-3 group relative cursor-pointer outline-none"
              :class="!isDark ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/40 bg-muted/20'"
            >
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Sun class="w-4 h-4 text-amber-500" />
                  <span>Light Theme</span>
                </div>
                <div 
                  v-if="!isDark" 
                  class="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold"
                >
                  ✓
                </div>
              </div>
              <p class="text-xs text-muted-foreground">Clean, high-contrast light theme for bright working environments.</p>
            </button>
          </div>
        </PropertyRow>
      </div>
    </section>

    <!-- Section: Editor Rulers -->
    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Editor Rulers</h4>
        <p class="text-xs text-muted-foreground mt-0.5">Toggle and configure rulers along the editor workspace canvas.</p>
      </div>

      <div class="space-y-4">
        <div class="flex items-center gap-4 py-1">
          <BaseCheckbox 
            v-model="showRulers" 
            label="Show Editor Rulers" 
            box-size="w-4 h-4" 
            icon-size="w-3 h-3" 
            text-size="text-sm" 
            data-testid="preferences-show-rulers-toggle"
          />
        </div>
      </div>
    </section>

    <!-- Section: Code Editor Preferences -->
    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Code Editor</h4>
        <p class="text-xs text-muted-foreground mt-0.5">Customize your script and custom node code editor settings.</p>
      </div>

      <div class="space-y-4">
        <PropertyRow label="Code Zoom Level">
          <div class="flex items-center gap-3">
            <BaseNumber 
              v-model="codeZoom" 
              :min="70" 
              :max="200" 
              :step="10"
              class="w-24 font-mono text-xs" 
              data-testid="preferences-code-zoom-input"
            />
            <span class="text-xs text-muted-foreground">%</span>
          </div>
        </PropertyRow>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Sun, Moon } from 'lucide-vue-next';
import { PropertyRow, BaseButton, BaseCheckbox, BaseNumber } from '@components/components.js';
import { useTheme } from '@composables/composables.js';
import { useInspectorBinding } from '@inspectors/inspectors.js';

defineProps({ info: Object });

const { isDark, toggleTheme } = useTheme();
const { bindSettingProp } = useInspectorBinding();
const showRulers = bindSettingProp(null, 'showRulers');
const codeZoom = bindSettingProp('codeEditor', 'zoom');

function setDarkTheme(wantDark) {
  if (isDark.value !== wantDark) {
    toggleTheme();
  }
}
</script>

<style scoped>
:deep(.property-row) { margin-bottom: 0; }
</style>
