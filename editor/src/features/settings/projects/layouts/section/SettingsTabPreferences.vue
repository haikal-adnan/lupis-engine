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
          <div class="flex items-center gap-3">
            <BaseButton
              data-testid="theme-toggle-btn"
              :data-theme="isDark ? 'dark' : 'light'"
              @click="toggleTheme"
            >
              <Moon v-if="isDark" class="w-4 h-4 mr-2 text-blue-400" />
              <Sun v-else class="w-4 h-4 mr-2 text-amber-500" />
              <span>{{ isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode' }}</span>
            </BaseButton>
            <span class="text-xs text-muted-foreground">
              Current active theme: <strong class="font-mono text-foreground capitalize">{{ isDark ? 'dark' : 'light' }}</strong>
            </span>
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
