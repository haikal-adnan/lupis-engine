<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useTheme } from "@commons/composables/useTheme.js";

import { 
  Gamepad2, 
  Github, 
  Sparkles, 
  ArrowRight, 
  LayoutGrid, 
  Paintbrush, 
  Layers, 
  Globe, 
  Cpu, 
  Zap,
  MessageSquare,
  PlaySquare
} from 'lucide-vue-next';

const router = useRouter();

const { initTheme } = useTheme();

onMounted(() => {
  initTheme();
});

const goToDashboard = () => {
  router.push('/dashboard');
};
</script>

<template>
  <div class="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-indigo-500/30">
    
    <header class="h-16 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-50 px-6">
      <div class="max-w-6xl mx-auto w-full h-full flex items-center">
        
        <div class="flex items-center gap-2.5 cursor-pointer flex-1">
          <div class="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Gamepad2 class="w-5 h-5 text-indigo-400" />
          </div>
          <span class="font-bold tracking-tight text-lg">Lupis Engine</span>
        </div>

        <nav class="hidden md:flex items-center justify-center gap-8 text-sm font-medium text-muted-foreground shrink-0">
          <a href="#" class="hover:text-foreground transition-colors">Games</a>
          <a href="#" class="hover:text-foreground transition-colors">Docs</a>
          <a href="#" class="hover:text-foreground transition-colors">Profile</a>
          <a href="#" class="hover:text-foreground transition-colors flex items-center gap-2">
            <Github class="w-4 h-4" /> GitHub
          </a>
        </nav>

        <div class="flex items-center justify-end gap-4 flex-1">
          <button class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Sign In
          </button>
          <button class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-sm shadow-indigo-500/20">
            Get Started - Free
          </button>
        </div>

      </div>
    </header>
    <main class="flex-1 flex flex-col items-center w-full">
      
      <section class="w-full max-w-5xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center">
        <div class="flex items-center gap-2 bg-secondary/50 border border-border rounded-full px-3 py-1 mb-8">
          <Sparkles class="w-3.5 h-3.5 text-indigo-400" />
          <span class="text-xs font-medium text-muted-foreground">Open Source 2D Game Engine <span class="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded ml-1">v0.9</span></span>
        </div>

        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Build Games <br />
          <span class="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Without Limits
          </span>
        </h1>

        <p class="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          A free, open-source 2D engine with a visual editor, node-based logic, 
          and one-click publishing to web, desktop & mobile.
        </p>

        <div class="flex flex-col sm:flex-row items-center gap-4">
          <button class="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3.5 rounded-xl text-base font-bold transition-all shadow-lg shadow-indigo-500/20">
            Download for Free <ArrowRight class="w-4 h-4" />
          </button>
          <button 
            @click="goToDashboard"
            class="w-full sm:w-auto flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary border border-border text-foreground px-8 py-3.5 rounded-xl text-base font-semibold transition-all"
          >
            Try in Browser
          </button>
        </div>

        <div class="mt-20">
          <p class="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">
            Made with Lupis Engine
          </p>
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
            <h4 class="text-3xl font-extrabold text-indigo-400 mb-1">12K+</h4>
            <p class="text-xs text-muted-foreground font-medium">Stars on GitHub</p>
          </div>
          <div class="bg-card border border-border rounded-xl p-6 text-center">
            <h4 class="text-3xl font-extrabold text-indigo-400 mb-1">3.4K</h4>
            <p class="text-xs text-muted-foreground font-medium">Discord Members</p>
          </div>
          <div class="bg-card border border-border rounded-xl p-6 text-center">
            <h4 class="text-3xl font-extrabold text-indigo-400 mb-1">28K</h4>
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

    </main>

    <footer class="w-full border-t border-border bg-background py-8 px-6">
      <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-2">
          <Gamepad2 class="w-5 h-5 text-indigo-400" />
          <span class="font-bold tracking-tight text-sm">Lupis Engine</span>
        </div>
        
        <nav class="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#" class="hover:text-foreground transition-colors">Docs</a>
          <a href="#" class="hover:text-foreground transition-colors">Contribute</a>
          <a href="#" class="hover:text-foreground transition-colors">Changelog</a>
          <a href="#" class="hover:text-foreground transition-colors">License (MIT)</a>
        </nav>

        <p class="text-xs text-muted-foreground">
          &copy; 2026 Lupis Engine. Open source, forever free.
        </p>
      </div>
    </footer>

  </div>
</template>