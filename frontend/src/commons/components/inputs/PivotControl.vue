<template>
  <div class="flex flex-col gap-1.5 items-center">
    <span class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Pivot</span>
    
    <div class="grid grid-cols-3 gap-1 p-1 bg-muted/40 rounded-md border border-border shadow-sm w-[52px] h-[52px]">
      <button 
        v-for="(p, index) in pivotPoints" 
        :key="index" 
        type="button" 
        @click="selectPivot(p)"
        class="w-full h-full rounded-[2px] transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-primary/50"
        :class="[
          active(p) 
            ? 'bg-primary shadow-sm scale-110' 
            : 'bg-slate-700 hover:bg-muted-foreground/40'
        ]"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  x: { type: Number, default: 0.5 },
  y: { type: Number, default: 0.5 }
})

const emit = defineEmits(['update'])

const pivotPoints = [
  { x: 0, y: 0 },   { x: 0.5, y: 0 },   { x: 1, y: 0 },
  { x: 0, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 1, y: 0.5 },
  { x: 0, y: 1 },   { x: 0.5, y: 1 },   { x: 1, y: 1 },
]

function active(p) {
  return Math.abs(props.x - p.x) < 0.01 && Math.abs(props.y - p.y) < 0.01
}

function selectPivot(p) {
  emit('update', { x: p.x, y: p.y })
}
</script>