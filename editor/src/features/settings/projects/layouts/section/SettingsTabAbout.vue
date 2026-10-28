<template>
  <div class="space-y-8 relative" data-testid="settings-tab-about-content">
    <!-- Section 1: Header / Brand -->
    <section class="space-y-5">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">About Lupis Engine</h4>
        <p class="text-xs text-muted-foreground mt-0.5">Engine details, runtime specifications, and community channels.</p>
      </div>

      <div class="p-6 rounded-2xl border border-border bg-muted/15 flex flex-col sm:flex-row sm:items-center gap-5">
        <img :src="'/assets/logo.svg'" alt="Lupis Engine Logo" class="w-10 h-10 object-contain" />

        <div class="flex-1 space-y-1.5">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h3 class="text-lg font-bold text-foreground tracking-tight">Lupis Engine</h3>
            <span 
              data-testid="about-engine-version-badge" 
              class="text-xs px-2 py-0.5 rounded-md font-bold font-mono text-cyan-500 border border-cyan-500"
            >
              v{{ ENGINE_VERSION }}
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider text-orange-400 border border-orange-500">
              Early Release
            </span>
          </div>
          <p class="text-xs sm:text-sm text-muted-foreground">
            A WebGL game engine written in native JavaScript, with a node-based visual editor.
          </p>
        </div>
      </div>
    </section>

    <!-- Section 2: Version Specifications -->
    <section class="space-y-4">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Version Information</h4>
        <p class="text-xs text-muted-foreground mt-0.5">Current engine runtime and tooling version.</p>
      </div>

      <div class="space-y-3">
        <PropertyRow label="Engine Version">
          <div class="flex items-center gap-2.5">
            <span 
              data-testid="about-engine-version" 
              class="text-sm font-mono font-semibold text-foreground px-3 py-1.5 rounded-lg border border-border bg-muted/30"
            >
              {{ ENGINE_VERSION }}
            </span>
            <span class="text-xs text-muted-foreground">v{{ ENGINE_VERSION }} (Early Release)</span>
          </div>
        </PropertyRow>
      </div>
    </section>

    <!-- Section 3: Community & Source Links -->
    <section class="space-y-4">
      <div class="border-b border-border pb-2">
        <h4 class="text-sm font-bold text-foreground">Community & Source</h4>
        <p class="text-xs text-muted-foreground mt-0.5">Access official source code and engage with other game developers.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- GitHub Link Card -->
        <a 
          :href="GITHUB_URL" 
          target="_blank" 
          rel="noopener noreferrer"
          data-testid="about-github-link"
          class="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-foreground/30 transition-all flex items-center justify-between group cursor-pointer"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Github class="w-5 h-5 text-foreground" />
            </div>
            <div>
              <div class="text-sm font-semibold text-foreground group-hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                <span>GitHub</span>
                <ExternalLink class="w-3.5 h-3.5 opacity-60" />
              </div>
              <p class="text-xs text-muted-foreground">Repository & issues</p>
            </div>
          </div>
        </a>

        <!-- Discord Link Card -->
        <a 
          :href="DISCORD_URL" 
          target="_blank" 
          rel="noopener noreferrer"
          data-testid="about-discord-link"
          class="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-[#5865F2]/40 transition-all flex items-center justify-between group cursor-pointer"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <DiscordIcon class="w-5 h-5 text-[#5865F2]" />
            </div>
            <div>
              <div class="text-sm font-semibold text-foreground group-hover:text-[#5865F2] transition-colors flex items-center gap-1.5">
                <span>Discord</span>
                <ExternalLink class="w-3.5 h-3.5 opacity-60" />
              </div>
              <p class="text-xs text-muted-foreground">Join our community</p>
            </div>
          </div>
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Github, ExternalLink } from 'lucide-vue-next';
import { PropertyRow, DiscordIcon } from '@components/components.js';
import { ENGINE_VERSION, GITHUB_URL, DISCORD_URL } from '@utils/constanta.js';

defineProps({
  info: Object
});
</script>
