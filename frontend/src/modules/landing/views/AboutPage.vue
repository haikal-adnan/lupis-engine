<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AuthPanel from '@/modules/auth/AuthPanel.vue'
import { useTheme } from "@commons/composables/useTheme.js";

import { 
  Gamepad2, 
  Box,
  Code2,
  Blocks
} from 'lucide-vue-next';

const router = useRouter();

const { initTheme } = useTheme();

onMounted(() => {
  initTheme();
});

const isAuthOpen = ref(false);
const authMode = ref('login');

const openAuth = (mode) => {
  authMode.value = mode;
  isAuthOpen.value = true;
};

const references = [
  '[1] Nystrom, R. (2014). "Game Programming Patterns." Genever Benning.',
  '[2] Gregory, J. (2018). "Game Engine Architecture." 3rd Edition. CRC Press.',
  '[3] Khronos Group. "WebGL 2.0 Specification." https://www.khronos.org/webgl/',
  '[4] Martin, A. (2007). "Entity Systems are the future of MMOG development." T-Machine Blog.',
  '[5] Caini, S. (2019). "EnTT: Gaming meets Modern C++." Open-source ECS framework documentation.',
  '[6] Mozilla Developer Network. "WebGL: 2D and 3D graphics for the web." MDN Web Docs.'
];

const assets = [
  { name: 'Lucide Icons', type: 'Icon Set', license: 'ISC License' },
  { name: 'Inter Typeface', type: 'Font', license: 'SIL Open Font License 1.1' },
  { name: 'JetBrains Mono', type: 'Font', license: 'SIL Open Font License 1.1' },
  { name: 'WebGL Fundamentals', type: 'Shader Reference', license: 'CC BY 4.0' }
];
</script>

<template>
  <section class="w-full max-w-4xl mx-auto px-6 pt-32 pb-10">
    <p class="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">About The Project</p>
    <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
      Lupis Engine
    </h1>
    <p class="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
      An Undergraduate Thesis Project: Development of a 2D Game Engine and Visual Editor Platform Based on Modular Components with WebGL Technology
    </p>
  </section>

  <div class="w-full max-w-4xl mx-auto px-6"><hr class="border-border" /></div>

    <section class="w-full max-w-4xl mx-auto px-6 py-10">
    <p class="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-5">Mission & Research Goal</p>
    <p class="text-lg text-foreground leading-relaxed text-justify">
        Lupis Engine aims to empower beginner game developers by providing an accessible browser based 2D game engine focused on 
        <span class="text-indigo-400">Visual Novels</span>, 
        <span class="text-indigo-400">Top-down RPGs</span>, and 
        <span class="text-indigo-400">Platformer</span> 
        genres through visual scripting and a modular component architecture that reduces the barrier to entry for interactive media creation.
    </p>
    </section>

  <div class="w-full max-w-4xl mx-auto px-6"><hr class="border-border" /></div>

  <section class="w-full max-w-4xl mx-auto px-6 py-10">
    <p class="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Core Technologies</p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-card border border-border rounded-xl p-5 hover:border-indigo-500/20 transition-colors">
        <Box class="w-5 h-5 text-indigo-400 mb-3" />
        <h3 class="text-lg font-bold mb-2">WebGL</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Hardware-accelerated 2D rendering via the browser's graphics pipeline.</p>
      </div>
      <div class="bg-card border border-border rounded-xl p-5 hover:border-indigo-500/20 transition-colors">
        <Code2 class="w-5 h-5 text-indigo-400 mb-3" />
        <h3 class="text-lg font-bold mb-2">JavaScript</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Core runtime for engine logic, scripting API, and browser interoperability.</p>
      </div>
      <div class="bg-card border border-border rounded-xl p-5 hover:border-indigo-500/20 transition-colors">
        <Blocks class="w-5 h-5 text-indigo-400 mb-3" />
        <h3 class="text-lg font-bold mb-2">Modular Component Architecture</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">Entity-Component-System inspired design enabling composable game objects.</p>
      </div>
    </div>
  </section>

  <div class="w-full max-w-4xl mx-auto px-6"><hr class="border-border" /></div>

  <section class="w-full max-w-4xl mx-auto px-6 py-10">
    <p class="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Creator</p>
    
    <div class="flex flex-col md:flex-row gap-8 items-start bg-card border border-border rounded-xl p-6 md:p-8">
      <div class="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xl font-bold tracking-wider shrink-0">
        HA
      </div>
      <div class="flex-1 w-full">
        <h3 class="text-2xl font-bold text-foreground mb-0.5">Haikal Adnan</h3>
        <p class="text-indigo-400 font-medium text-sm mb-5">haikal.adnan32@gmail.com</p>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12 pt-5 border-t border-border">
          <div>
            <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Major</p>
            <p class="text-foreground text-sm font-medium">Pendidikan Komputer</p>
          </div>
          <div>
            <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Faculty</p>
            <p class="text-foreground text-sm font-medium">Fakultas Keguruan dan Ilmu Pendidikan</p>
          </div>
          <div class="sm:col-span-2">
            <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">University</p>
            <p class="text-foreground text-sm font-medium">Universitas Lambung Mangkurat</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="w-full max-w-4xl mx-auto px-6"><hr class="border-border" /></div>

  <section class="w-full max-w-4xl mx-auto px-6 py-10">
    <p class="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Supervisor</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold tracking-wider shrink-0">
          HS
        </div>
        <div>
          <h4 class="font-bold text-foreground">Dr. Harja Santana Purba, M.Kom.</h4>
          <p class="text-sm text-muted-foreground">First Supervisor</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold tracking-wider shrink-0">
          NA
        </div>
        <div>
          <h4 class="font-bold text-foreground">Novan Alkaf Bahrain Saputra, S.Kom., M.T.</h4>
          <p class="text-sm text-muted-foreground">Second Supervisor</p>
        </div>
      </div>
    </div>
  </section>

  <div class="w-full max-w-4xl mx-auto px-6"><hr class="border-border" /></div>

  <section class="w-full max-w-4xl mx-auto px-6 py-10">
    <p class="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Academic References & Bibliography</p>
    <div class="space-y-3 font-mono text-xs md:text-sm text-muted-foreground leading-relaxed">
      <p v-for="(refText, index) in references" :key="index">
        <span class="text-foreground mr-1 font-bold">{{ refText.substring(0, 3) }}</span>{{ refText.substring(3) }}
      </p>
    </div>
  </section>

  <div class="w-full max-w-4xl mx-auto px-6"><hr class="border-border" /></div>

  <section class="w-full max-w-4xl mx-auto px-6 py-10">
    <p class="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">License & Open Source</p>
    <div class="bg-card border border-border rounded-xl p-6">
      <h4 class="text-indigo-400 font-mono text-sm font-semibold mb-4 italic">MIT License</h4>
      <div class="space-y-4 font-mono text-[11px] md:text-xs text-muted-foreground leading-relaxed">
        <p>Copyright (c) 2026 Lupis Engine Contributors</p>
        <p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files...</p>
        <p class="uppercase font-bold opacity-80 text-[10px]">THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED...</p>
      </div>
    </div>
  </section>

  <div class="w-full max-w-4xl mx-auto px-6"><hr class="border-border" /></div>

  <section class="w-full max-w-4xl mx-auto px-6 py-10">
    <p class="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Asset Attribution</p>
    <div class="overflow-hidden border border-border rounded-xl bg-card">
      <table class="w-full text-left border-collapse text-xs md:text-sm">
        <thead>
          <tr class="border-b border-border bg-secondary/30">
            <th class="p-3 font-bold text-foreground">ASSET</th>
            <th class="p-3 font-bold text-foreground">TYPE</th>
            <th class="p-3 font-bold text-foreground">LICENSE</th>
          </tr>
        </thead>
        <tbody class="text-muted-foreground">
          <tr v-for="(asset, index) in assets" :key="index" class="border-b border-border last:border-0 hover:bg-secondary/10 transition-colors">
            <td class="p-3 font-medium text-foreground">{{ asset.name }}</td>
            <td class="p-3">{{ asset.type }}</td>
            <td class="p-3 font-mono text-[10px] md:text-xs">{{ asset.license }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>