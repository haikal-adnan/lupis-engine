<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from "@commons/composables/useTheme.js";

import { useAuthStore } from '@/stores/useAuthStore.js'; 

import { 
  Gamepad2, Github, Sparkles, ArrowRight, LayoutGrid, Paintbrush, Layers, Globe, Cpu, Zap, MessageSquare, PlaySquare
} from 'lucide-vue-next';

const router = useRouter();
const { initTheme } = useTheme();

const authStore = useAuthStore();

onMounted(() => {
  initTheme();
});

const handleTryInBrowser = () => {
  if (authStore.isLoggedIn) {
    router.push('/dashboard');
  } else {
    authStore.openAuthModal('login');
  }
};
</script>

<template>
  <section class="relative w-full h-[calc(100vh+4rem)] overflow-hidden flex items-center justify-center text-center px-6 -mt-16">
    
    <video autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none">
      <source src="/lupis_engine_showcase.mp4" type="video/mp4">
    </video>

    <div class="absolute inset-0 bg-black/60 z-0"></div>
    <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent z-0"></div>

    <div class="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center drop-shadow-lg">
      <div class="flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-full px-3 py-1 mb-6">
        <Sparkles class="w-3.5 h-3.5 text-indigo-400" />
        <span class="text-xs font-medium text-white/90">Open Source 2D Game Engine <span class="bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded ml-1">v1.0</span></span>
      </div>

      <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight mb-5 leading-tight text-white">
        Build Games <br />
        <span class="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
          Without Limits
        </span>
      </h1>

      <p class="text-base md:text-lg text-white/80 max-w-2xl mb-8 leading-relaxed">
        A free, open-source 2D engine with a visual editor, node-based logic, 
        and one-click publishing to web, desktop & mobile.
      </p>

      <div class="flex flex-col sm:flex-row items-center gap-4">
        <button class="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-7 py-3 rounded-xl text-base font-bold transition-all shadow-lg shadow-indigo-500/20 backdrop-blur-sm">
          Download for Free <ArrowRight class="w-4 h-4" />
        </button>
        <button 
          @click="handleTryInBrowser"
          class="w-full sm:w-auto flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 border border-white/20 text-white px-7 py-3 rounded-xl text-base font-semibold transition-all backdrop-blur-md"
        >
          Try in Browser
        </button>
      </div>
    </div>
  </section>

  <section class="w-full max-w-6xl mx-auto px-6 py-24 border-t border-border">
    <div class="text-center mb-8">
      <p class="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Features</p>
      <h2 class="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Ship a Game</h2>
      <p class="text-muted-foreground">From level editing to publishing, all built into one streamlined workflow.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-card border border-border rounded-xl p-6 hover:border-indigo-500/30 transition-colors group">
        <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-5 group-hover:bg-indigo-500/20 transition-colors">
          <LayoutGrid class="w-5 h-5 text-indigo-400" />
        </div>
        <h3 class="text-xl font-bold mb-3 mt-4">Visual Event System</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Drag-and-drop node logic no coding required. Wire up behaviors, collisions, and AI visually.</p>
      </div>
      <div class="bg-card border border-border rounded-xl p-6 hover:border-indigo-500/30 transition-colors group">
        <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-5 group-hover:bg-indigo-500/20 transition-colors">
          <Paintbrush class="w-5 h-5 text-indigo-400" />
        </div>
        <h3 class="text-xl font-bold mb-3 mt-4">Integrated Editor</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Paint, animate, and tile sprites without leaving the engine. Full onion-skinning support.</p>
      </div>
      <div class="bg-card border border-border rounded-xl p-6 hover:border-indigo-500/30 transition-colors group">
        <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-5 group-hover:bg-indigo-500/20 transition-colors">
          <Layers class="w-5 h-5 text-indigo-400" />
        </div>
        <h3 class="text-xl font-bold mb-3 mt-4">Tilemap & Physics</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Built-in tilemap editor with auto-tiling and a tweakable 2D physics engine out of the box.</p>
      </div>
      <div class="bg-card border border-border rounded-xl p-6 hover:border-indigo-500/30 transition-colors group">
        <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-5 group-hover:bg-indigo-500/20 transition-colors">
          <Globe class="w-5 h-5 text-indigo-400" />
        </div>
        <h3 class="text-xl font-bold mb-3 mt-4">One-Click Export</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Publish to web, Windows, macOS, Linux, Android & iOS from a single project file.</p>
      </div>
      <div class="bg-card border border-border rounded-xl p-6 hover:border-indigo-500/30 transition-colors group">
        <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-5 group-hover:bg-indigo-500/20 transition-colors">
          <Cpu class="w-5 h-5 text-indigo-400" />
        </div>
        <h3 class="text-xl font-bold mb-3 mt-4">Blazing Performance</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">WebGPU-accelerated rendering with automatic batching. Handles thousands of sprites at 60fps.</p>
      </div>
      <div class="bg-card border border-border rounded-xl p-6 hover:border-indigo-500/30 transition-colors group">
        <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-5 group-hover:bg-indigo-500/20 transition-colors">
          <Zap class="w-5 h-5 text-indigo-400" />
        </div>
        <h3 class="text-xl font-bold mb-3 mt-4">Extensible Plugins</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Extend the engine with community plugins or write your own in TypeScript or GDScript.</p>
      </div>
    </div>
  </section>

  <section class="w-full px-6 py-24 bg-secondary/20 border-t border-border flex flex-col items-center">
    <div class="text-center mb-12">
      <p class="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Community</p>
      <h2 class="text-3xl md:text-4xl font-bold mb-4">Join Thousands of Creators</h2>
      <p class="text-muted-foreground max-w-xl mx-auto">Share your creations, get feedback, and collaborate with fellow game developers worldwide.</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl w-full mb-10">
      <div class="bg-card border border-border rounded-xl p-6 text-center">
        <h4 class="text-3xl font-extrabold text-indigo-400 mb-1">1</h4>
        <p class="text-xs text-muted-foreground font-medium">Stars on GitHub</p>
      </div>
      <div class="bg-card border border-border rounded-xl p-6 text-center">
        <h4 class="text-3xl font-extrabold text-indigo-400 mb-1">1</h4>
        <p class="text-xs text-muted-foreground font-medium">Discord Members</p>
      </div>
      <div class="bg-card border border-border rounded-xl p-6 text-center">
        <h4 class="text-3xl font-extrabold text-indigo-400 mb-1">0</h4>
        <p class="text-xs text-muted-foreground font-medium">Games Published</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-center gap-4">
      <button class="flex items-center gap-2 bg-secondary border border-border hover:bg-secondary/80 text-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
        <Github class="w-4 h-4" /> Star on GitHub
      </button>
      <button class="flex items-center gap-2 bg-secondary border border-border hover:bg-secondary/80 text-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
        <MessageSquare class="w-4 h-4" /> Join Discord
      </button>
      <button class="flex items-center gap-2 bg-secondary border border-border hover:bg-secondary/80 text-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
        <PlaySquare class="w-4 h-4" /> Browse Games
      </button>
    </div>
  </section>
</template>