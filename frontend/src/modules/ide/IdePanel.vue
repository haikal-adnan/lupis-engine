<template>
      <div class="h-full w-full bg-[#1e1e1e] text-[#d4d4d4] p-4 font-mono text-sm overflow-auto leading-6">
      <div class="text-green-600">// PlayerController.js</div>
      <div class="mt-2"><span class="text-blue-400">import</span> { Entity } <span class="text-blue-400">from</span> <span class="text-orange-400">'engine'</span>;</div>
      <br>
      <div><span class="text-blue-400">class</span> <span class="text-yellow-400">PlayerController</span> <span class="text-blue-400">extends</span> <span class="text-emerald-400">Entity</span> {</div>
      <div class="pl-4"><span class="text-yellow-200">onStart</span>() {</div>
      <div class="pl-8 text-green-600">// Initialize player stats</div>
      <div class="pl-8">this.speed = <span class="text-rose-400">100</span>;</div>
      <div class="pl-4">}</div>
      <br>
      <div class="pl-4"><span class="text-yellow-200">onUpdate</span>(dt) {</div>
      <div class="pl-8 text-green-600">// Handle movement logic</div>
      <div class="pl-8">if (Input.isKeyDown(<span class="text-orange-400">'SPACE'</span>)) {</div>
      <div class="pl-12">this.jump();</div>
      <div class="pl-8">}</div>
      <div class="pl-4">}</div>
      <div>}</div>
    </div>
</template>