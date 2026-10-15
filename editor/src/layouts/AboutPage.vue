<script setup>
import { 
  Box, 
  Code2, 
  Blocks 
} from 'lucide-vue-next';

const projectInfo = {
  title: 'Lupis Engine',
  subtitle: 'Undergraduate Thesis Project: Development of a 2D Game Engine and Modular Component-Based Visual Editor Platform with WebGL Technology',
  mission: 'Lupis Engine aims to empower beginner game developers by providing an accessible browser-based 2D game engine through visual scripting and modular component architecture that lowers the entry barrier to 2D game creation.',
  targetGenres: ['Visual Novel', 'Top-down RPG', 'Platformer']
};

const technologies = [
  {
    icon: Box,
    title: 'WebGL',
    description: 'Hardware-accelerated 2D rendering via the browser graphics pipeline.'
  },
  {
    icon: Code2,
    title: 'JavaScript',
    description: 'Primary runtime for engine logic, scripting API, and browser interoperability.'
  },
  {
    icon: Blocks,
    title: 'Modular Component Architecture',
    description: 'Entity-Component-System design pattern for flexible game object creation.'
  }
];

const author = {
  initials: 'HA',
  name: 'Haikal Adnan',
  role: 'Developer & Researcher',
  department: 'Computer Education',
  faculty: 'Teacher Training and Education',
  university: 'Universitas Lambung Mangkurat'
};

const advisors = [
  {
    initials: 'HS',
    name: 'Advisor One',
    role: 'Primary Advisor'
  },
  {
    initials: 'NA',
    name: 'Advisor Two',
    role: 'Co-Advisor'
  }
];

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
    <p class="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">About Project</p>
    <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
      {{ projectInfo.title }}
    </h1>
    <p class="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
      {{ projectInfo.subtitle }}
    </p>
  </section>

  <div class="w-full max-w-4xl mx-auto px-6"><hr class="border-border" /></div>

  <section class="w-full max-w-4xl mx-auto px-6 py-10">
    <p class="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-5">Mission & Research Goals</p>
    <p class="text-lg text-foreground leading-relaxed text-justify">
      {{ projectInfo.mission }} Focused on genres: 
      <span v-for="(genre, index) in projectInfo.targetGenres" :key="genre">
        <span class="text-cyan-400 font-semibold">{{ genre }}</span>
        <span v-if="index < projectInfo.targetGenres.length - 1">, </span>
      </span>.
    </p>
  </section>

  <div class="w-full max-w-4xl mx-auto px-6"><hr class="border-border" /></div>

  <section class="w-full max-w-4xl mx-auto px-6 py-10">
    <p class="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-6">Core Technologies</p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div 
        v-for="tech in technologies" 
        :key="tech.title" 
        class="bg-card border border-border rounded-xl p-5 hover:border-cyan-500/20 transition-colors"
      >
        <component :is="tech.icon" class="w-5 h-5 text-cyan-400 mb-3" />
        <h3 class="text-lg font-bold mb-2">{{ tech.title }}</h3>
        <p class="text-muted-foreground text-sm leading-relaxed">{{ tech.description }}</p>
      </div>
    </div>
  </section>

  <div class="w-full max-w-4xl mx-auto px-6"><hr class="border-border" /></div>

  <section class="w-full max-w-4xl mx-auto px-6 py-10">
    <p class="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-6">Author</p>
    
    <div class="flex flex-col md:flex-row gap-8 items-start bg-card border border-border rounded-xl p-6 md:p-8">
      <div class="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl font-bold tracking-wider shrink-0">
        {{ author.initials }}
      </div>
      <div class="flex-1 w-full">
        <h3 class="text-2xl font-bold text-foreground mb-0.5">{{ author.name }}</h3>
        <p class="text-cyan-400 font-medium text-sm mb-5">{{ author.role }}</p>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12 pt-5 border-t border-border">
          <div>
            <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Department</p>
            <p class="text-foreground text-sm font-medium">{{ author.department }}</p>
          </div>
          <div>
            <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Faculty</p>
            <p class="text-foreground text-sm font-medium">{{ author.faculty }}</p>
          </div>
          <div class="sm:col-span-2">
            <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">University</p>
            <p class="text-foreground text-sm font-medium">{{ author.university }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="w-full max-w-4xl mx-auto px-6"><hr class="border-border" /></div>

  <section class="w-full max-w-4xl mx-auto px-6 py-10">
    <p class="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-6">Advisors</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div v-for="advisor in advisors" :key="advisor.name" class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold tracking-wider shrink-0">
          {{ advisor.initials }}
        </div>
        <div>
          <h4 class="font-bold text-foreground">{{ advisor.name }}</h4>
          <p class="text-sm text-muted-foreground">{{ advisor.role }}</p>
        </div>
      </div>
    </div>
  </section>

  <div class="w-full max-w-4xl mx-auto px-6"><hr class="border-border" /></div>

  <section class="w-full max-w-4xl mx-auto px-6 py-10">
    <p class="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-6">Academic References & Bibliography</p>
    <div class="space-y-3 font-mono text-xs md:text-sm text-muted-foreground leading-relaxed">
      <p v-for="(refText, index) in references" :key="index">
        <span class="text-foreground mr-1 font-bold">{{ refText.substring(0, 3) }}</span>{{ refText.substring(3) }}
      </p>
    </div>
  </section>

  <div class="w-full max-w-4xl mx-auto px-6"><hr class="border-border" /></div>

  <section class="w-full max-w-4xl mx-auto px-6 py-10">
    <p class="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-6">License & Open Source</p>
    <div class="bg-card border border-border rounded-xl p-6">
      <h4 class="text-cyan-400 font-mono text-sm font-semibold mb-4 italic">MIT License</h4>
      <div class="space-y-4 font-mono text-[11px] md:text-xs text-muted-foreground leading-relaxed">
        <p>Copyright (c) 2026 Lupis Engine Contributors</p>
        <p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files...</p>
        <p class="uppercase font-bold opacity-80 text-[10px]">THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED...</p>
      </div>
    </div>
  </section>

  <div class="w-full max-w-4xl mx-auto px-6"><hr class="border-border" /></div>

  <section class="w-full max-w-4xl mx-auto px-6 py-10">
    <p class="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-6">Asset Credits</p>
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