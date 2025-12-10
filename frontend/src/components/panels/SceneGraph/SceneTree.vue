<template>
  <div class="text-sm select-none">
    <ul class="space-y-0.5">
      <SceneNode
        v-for="(node, index) in sceneData"
        :key="index"
        :node="node"
        :level="0"
      />
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SceneNode from './SceneNode.vue';

// Dummy Data Struktur Game (Nanti diganti state asli engine)
const sceneData = ref([
  {
    name: "Main Scene",
    type: "folder",
    children: [
      {
        name: "Main Camera",
        type: "camera",
        children: []
      },
      {
        name: "Player",
        type: "mesh",
        children: [
            { name: "Sprite", type: "node" },
            { name: "CollisionBox", type: "node" }
        ]
      },
      {
        name: "Environment",
        type: "node",
        children: [
            { name: "Ground_01", type: "mesh" },
            { name: "Ground_02", type: "mesh" },
            { name: "Background", type: "mesh" }
        ]
      }
    ]
  }
]);
</script>