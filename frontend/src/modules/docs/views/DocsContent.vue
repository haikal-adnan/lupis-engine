<script setup>
import { 
  Info, Zap, BookOpen, Box, Layers, 
  AlertTriangle, AlertCircle, Lightbulb, Check
} from 'lucide-vue-next';

const iconMap = { Zap, BookOpen, Box, Layers };

defineProps({
  data: {
    type: Object,
    required: true
  }
});

const formatDataType = (text) => {
  const types = ['String', 'Number', 'Boolean', 'Vector2', 'Object', 'Array'];
  if (types.includes(text)) {
    let color = 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20'; 
    if (text === 'String') color = 'text-green-500 bg-green-500/10 border-green-500/20';
    if (text === 'Number' || text === 'Vector2') color = 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    if (text === 'Boolean') color = 'text-pink-500 bg-pink-500/10 border-pink-500/20';
    
    return `<span class="px-1.5 py-0.5 rounded text-[11px] font-mono border ${color}">${text}</span>`;
  }
  return text;
};
</script>

<template>
  <div v-if="data" class="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24">
    
    <h1 class="text-4xl font-extrabold tracking-tight mb-4 text-foreground">
      {{ data.title }}
    </h1>
    <p class="text-lg text-muted-foreground mb-8 leading-relaxed">
      {{ data.description }}
    </p>

    <div v-if="data.infoBox" class="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4 mb-8 flex gap-3 items-start">
      <Info class="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
      <p class="text-sm text-muted-foreground m-0">{{ data.infoBox }}</p>
    </div>

    <div v-if="data.features" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 not-prose">
      <div v-for="feat in data.features" :key="feat.title" class="border border-border rounded-xl p-5 bg-card hover:border-cyan-500/30 transition-colors">
        <component :is="iconMap[feat.icon]" class="w-5 h-5 mb-3" :class="feat.color" />
        <h3 class="font-semibold text-foreground mb-1">{{ feat.title }}</h3>
        <p class="text-sm text-muted-foreground">{{ feat.desc }}</p>
      </div>
    </div>

    <div v-for="section in data.sections" :key="section.id" class="mt-12">
      
      <h2 :id="section.id" class="text-2xl font-bold border-b border-border pb-2 mb-6 text-foreground">
        {{ section.title }}
      </h2>
      <p v-if="section.content" class="mb-6 text-muted-foreground leading-relaxed">
        {{ section.content }}
      </p>

      <div v-if="section.alert" 
           class="my-6 p-4 rounded-lg border-l-4 not-prose"
           :class="{
             'bg-blue-500/10 border-blue-500': section.alert.type === 'info',
             'bg-amber-500/10 border-amber-500': section.alert.type === 'warning',
             'bg-red-500/10 border-red-500': section.alert.type === 'danger',
             'bg-green-500/10 border-green-500': section.alert.type === 'tip'
           }">
        <div class="flex items-center gap-2 font-bold mb-1.5 uppercase text-xs tracking-wider"
             :class="{
               'text-blue-500': section.alert.type === 'info',
               'text-amber-500': section.alert.type === 'warning',
               'text-red-500': section.alert.type === 'danger',
               'text-green-500': section.alert.type === 'tip'
             }">
          <Info v-if="section.alert.type === 'info'" class="w-4 h-4" />
          <AlertTriangle v-if="section.alert.type === 'warning'" class="w-4 h-4" />
          <AlertCircle v-if="section.alert.type === 'danger'" class="w-4 h-4" />
          <Lightbulb v-if="section.alert.type === 'tip'" class="w-4 h-4" />
          {{ section.alert.type }}
        </div>
        <p class="m-0 text-sm text-foreground/80 leading-relaxed">{{ section.alert.message }}</p>
      </div>

      <div v-if="section.code" class="bg-[#1e1e2e] text-slate-300 rounded-lg p-4 mb-8 border border-[#313244] not-prose">
        <div class="flex justify-between items-center mb-2 pb-2 border-b border-[#313244]/50">
          <span class="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{{ section.code.language }}</span>
        </div>
        <pre class="m-0 p-0 bg-transparent text-sm font-mono overflow-x-auto"><code>{{ section.code.snippet }}</code></pre>
      </div>

      <ol v-if="section.steps" class="space-y-4 my-8 list-none p-0 not-prose">
        <li v-for="(step, idx) in section.steps" :key="idx" class="flex gap-4 items-start bg-muted/20 p-4 rounded-lg border border-border">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold mt-0.5 shadow-sm shadow-cyan-500/20">
            {{ idx + 1 }}
          </span>
          <span class="text-sm text-foreground/90 leading-relaxed">{{ step }}</span>
        </li>
      </ol>

      <div v-if="section.shortcuts" class="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6 not-prose">
        <div v-for="(shortcut, idx) in section.shortcuts" :key="idx" class="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
          <span class="text-sm text-muted-foreground">{{ shortcut.description }}</span>
          <div class="flex items-center gap-1.5">
            <kbd v-for="key in shortcut.keys" :key="key" class="h-6 min-w-[24px] px-1.5 inline-flex items-center justify-center rounded border border-border bg-muted text-[11px] font-mono font-medium text-foreground shadow-sm">
              {{ key }}
            </kbd>
          </div>
        </div>
      </div>

      <figure v-if="section.image" class="my-8 not-prose">
        <div class="rounded-xl overflow-hidden border border-border bg-muted/30 shadow-sm">
          <img :src="section.image.url" :alt="section.image.alt" class="w-full h-auto object-cover block" loading="lazy" />
        </div>
        <figcaption v-if="section.image.caption" class="text-center text-sm text-muted-foreground mt-3 px-4">
          {{ section.image.caption }}
        </figcaption>
      </figure>

      <figure v-if="section.video" class="my-8 not-prose">
        <div class="rounded-xl overflow-hidden border border-border bg-black shadow-sm relative group">
          <video 
            :src="section.video.url" 
            :poster="section.video.poster"
            :controls="section.video.controls !== false" 
            :autoplay="section.video.autoplay"
            :loop="section.video.loop"
            :muted="section.video.muted || section.video.autoplay"
            class="w-full h-auto block"
            playsinline
          ></video>
        </div>
        <figcaption v-if="section.video.caption" class="text-center text-sm text-muted-foreground mt-3 px-4">
          {{ section.video.caption }}
        </figcaption>
      </figure>

      <div v-if="section.table" class="my-8 overflow-x-auto border border-border rounded-lg not-prose bg-card">
        <table class="w-full text-sm text-left">
          <thead class="bg-muted/50 text-foreground font-semibold border-b border-border">
            <tr>
              <th v-for="header in section.table.headers" :key="header" class="px-4 py-3 whitespace-nowrap">{{ header }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="(row, idx) in section.table.rows" :key="idx" class="hover:bg-muted/30 transition-colors">
              <td v-for="(cell, cIdx) in row" :key="cIdx" class="px-4 py-3 text-muted-foreground">
                <span v-if="cIdx === 0" class="font-mono text-cyan-400 font-medium">{{ cell }}</span>
                <span v-else v-html="formatDataType(cell)"></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <div class="h-[60vh]"></div>
  </div>
  
  <div v-else class="flex flex-col items-center justify-center py-32 text-center">
    <BookOpen class="w-12 h-12 text-muted-foreground/30 mb-4" />
    <h3 class="text-lg font-bold text-foreground">Documentation not found</h3>
    <p class="text-muted-foreground">Please select a topic from the sidebar.</p>
  </div>
</template>