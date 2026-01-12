<template> 
    <div class="p-4 flex flex-col gap-4">
      <div class="p-3 bg-muted/20 rounded border border-border">
        <h4 class="font-bold text-xs mb-2">Tile Palette</h4>
        <div class="grid grid-cols-4 gap-1">
          <div v-for="i in 16" :key="i" class="aspect-square bg-secondary rounded hover:bg-primary/20 cursor-pointer border border-transparent hover:border-primary/50 transition-colors"></div>
        </div>
      </div>
      <div class="text-xs text-muted-foreground p-2 border border-dashed border-border rounded">
        Select a tile to paint on the canvas.
      </div>
    </div>
</template>