<script setup>
import { 
  Info, Zap, BookOpen, Box, Layers, 
  AlertTriangle, AlertCircle, Lightbulb, Check
} from 'lucide-vue-next';

const iconMap = { Zap, BookOpen, Box, Layers };

defineProps({
  data: {
    type: Object,
    required: false
  }
});

const emit = defineEmits(['smartNavigate']);

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

const renderMarkdown = (text) => {
  if (!text) return '';
  
  let parsed = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>');
  
  parsed = parsed.replace(/\*(.*?)\*/g, '<em class="italic text-foreground/90">$1</em>');
  
  parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
    if (url.startsWith('http')) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-cyan-500 hover:text-cyan-400 font-medium underline decoration-cyan-500/30 underline-offset-4 transition-colors">${linkText}</a>`;
    } 
    else {
      return `<a href="${url}" data-internal-link="true" class="text-cyan-500 hover:text-cyan-400 font-medium underline decoration-cyan-500/30 underline-offset-4 transition-colors cursor-pointer">${linkText}</a>`;
    }
  });

  return parsed;
};

const handleContentClick = (e) => {
  const anchor = e.target.closest('a');
  if (!anchor) return;

  if (anchor.getAttribute('data-internal-link') === 'true') {
    e.preventDefault();
    const url = anchor.getAttribute('href');
    emit('smartNavigate', url); 
  }
};
</script>

<template>
  <div v-if="data" @click="handleContentClick" class="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24">
    
    <h1 class="text-4xl font-extrabold tracking-tight mb-4 text-foreground">
      {{ data.title }}
    </h1>
    
    <p class="text-lg text-muted-foreground mb-8 leading-relaxed text-justify" v-html="renderMarkdown(data.description)"></p>

    <div v-for="section in data.sections" :key="section.id" class="mt-12">
      <h2 :id="section.id" class="text-2xl font-bold border-b border-border pb-2 mb-6 text-foreground">
        {{ section.title }}
      </h2>
      
      <template v-for="(block, bIdx) in section.blocks" :key="bIdx">
        <p v-if="block.type === 'text'" class="mb-6 text-muted-foreground leading-relaxed text-justify" v-html="renderMarkdown(block.content)"></p>
        
        <div v-else-if="block.type === 'alert'" 
             class="my-6 p-4 rounded-lg border-l-4 not-prose"
             :class="{
               'bg-blue-500/10 border-blue-500': block.variant === 'info',
               'bg-amber-500/10 border-amber-500': block.variant === 'warning',
               'bg-red-500/10 border-red-500': block.variant === 'danger',
               'bg-green-500/10 border-green-500': block.variant === 'tip'
             }">
          <div class="flex items-center gap-2 font-bold mb-1.5 uppercase text-xs tracking-wider"
               :class="{
                 'text-blue-500': block.variant === 'info',
                 'text-amber-500': block.variant === 'warning',
                 'text-red-500': block.variant === 'danger',
                 'text-green-500': block.variant === 'tip'
               }">
            <Info v-if="block.variant === 'info'" class="w-4 h-4" />
            <AlertTriangle v-if="block.variant === 'warning'" class="w-4 h-4" />
            <AlertCircle v-if="block.variant === 'danger'" class="w-4 h-4" />
            <Lightbulb v-if="block.variant === 'tip'" class="w-4 h-4" />
            {{ block.variant }}
          </div>
          <p class="m-0 text-sm text-foreground/80 leading-relaxed text-justify" v-html="renderMarkdown(block.message)"></p>
        </div>

        <div v-else-if="block.type === 'features'" class="grid grid-cols-1 md:grid-cols-2 gap-4 my-8 not-prose">
          <div v-for="feat in block.items" :key="feat.title" class="border border-border rounded-xl p-5 bg-card hover:border-cyan-500/30 transition-colors">
            <component :is="iconMap[feat.icon]" class="w-5 h-5 mb-3" :class="feat.color" />
            <h3 class="font-semibold text-foreground mb-1">{{ feat.title }}</h3>
            <p class="text-sm text-muted-foreground text-justify" v-html="renderMarkdown(feat.desc)"></p>
          </div>
        </div>

        <div v-else-if="block.type === 'code'" class="bg-[#1e1e2e] text-slate-300 rounded-lg p-4 mb-8 border border-[#313244] not-prose">
          <div class="flex justify-between items-center mb-2 pb-2 border-b border-[#313244]/50">
            <span class="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{{ block.language }}</span>
          </div>
          <pre class="m-0 p-0 bg-transparent text-sm font-mono overflow-x-auto"><code>{{ block.snippet }}</code></pre>
        </div>

        <ol v-else-if="block.type === 'steps'" class="space-y-4 my-8 list-none p-0 not-prose">
          <li v-for="(step, idx) in block.items" :key="idx" class="flex gap-4 items-start bg-muted/20 p-4 rounded-lg border border-border">
            <span class="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold mt-0.5 shadow-sm shadow-cyan-500/20">
              {{ idx + 1 }}
            </span>
            <div class="text-sm text-foreground/90 leading-relaxed text-justify flex-1" v-html="renderMarkdown(step)"></div>
          </li>
        </ol>

        <div v-else-if="block.type === 'shortcuts'" class="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6 not-prose">
          <div v-for="(shortcut, idx) in block.items" :key="idx" class="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <span class="text-sm text-muted-foreground" v-html="renderMarkdown(shortcut.description)"></span>
            <div class="flex items-center gap-1.5">
              <kbd v-for="key in shortcut.keys" :key="key" class="h-6 min-w-[24px] px-1.5 inline-flex items-center justify-center rounded border border-border bg-muted text-[11px] font-mono font-medium text-foreground shadow-sm">
                {{ key }}
              </kbd>
            </div>
          </div>
        </div>

        <figure v-else-if="block.type === 'image'" class="my-8 not-prose">
          <div class="rounded-xl overflow-hidden border border-border bg-muted/30 shadow-sm">
            <img :src="block.url" :alt="block.alt" class="w-full h-auto object-cover block" loading="lazy" />
          </div>
          <figcaption v-if="block.caption" class="text-center text-sm text-muted-foreground mt-3 px-4" v-html="renderMarkdown(block.caption)"></figcaption>
        </figure>

        <figure v-else-if="block.type === 'video'" class="my-8 not-prose">
          <div class="rounded-xl overflow-hidden border border-border bg-black shadow-sm relative group">
            <video 
              :src="block.url" 
              :poster="block.poster"
              :controls="block.controls !== false" 
              :autoplay="block.autoplay"
              :loop="block.loop"
              :muted="block.muted || block.autoplay"
              class="w-full h-auto block"
              playsinline
            ></video>
          </div>
          <figcaption v-if="block.caption" class="text-center text-sm text-muted-foreground mt-3 px-4" v-html="renderMarkdown(block.caption)"></figcaption>
        </figure>

        <!-- BAGIAN YANG DIPERBARUI: v-html="renderMarkdown(...)" diterapkan pada tabel header dan cell -->
        <div v-else-if="block.type === 'table'" class="my-8 overflow-x-auto border border-border rounded-lg not-prose bg-card">
          <table class="w-full text-sm text-left">
            <thead class="bg-muted/50 text-foreground font-semibold border-b border-border">
              <tr>
                <th v-for="header in block.headers" :key="header" class="px-4 py-3 whitespace-nowrap" v-html="renderMarkdown(header)"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="(row, idx) in block.rows" :key="idx" class="hover:bg-muted/30 transition-colors">
                <td v-for="(cell, cIdx) in row" :key="cIdx" class="px-4 py-3 text-muted-foreground">
                  <span v-if="cIdx === 0" class="font-mono text-cyan-400 font-medium" v-html="renderMarkdown(cell)"></span>
                  <span v-else v-html="renderMarkdown(formatDataType(cell))"></span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </template>
    </div>
    
    <div class="h-[60vh]"></div>
  </div>
  
  <div v-else class="flex flex-col items-center justify-center py-32 text-center">
    <BookOpen class="w-12 h-12 text-muted-foreground/30 mb-4" />
    <h3 class="text-lg font-bold text-foreground">Loading Documentation...</h3>
  </div>
</template>