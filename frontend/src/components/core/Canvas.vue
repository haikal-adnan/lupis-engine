<!-- src/components/Canvas.vue -->
<template>
  <div class="w-full h-full relative overflow-hidden flex flex-col">
    <div class="relative flex-1 overflow-hidden bg-canvas shadow-inner">
      <canvas id="glCanvas" class="absolute inset-0 w-full h-full"></canvas>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, nextTick } from "vue"
import { startEngine } from "@engine/main.js"

const previewWindow = ref(null)
const onCloseCallbacks = []

async function loadProject() {
  const project = await fetch("/projects/ProjectTemplate/project.json").then(r => r.json())
  const scene = await fetch(`/projects/ProjectTemplate/scenes/${project.startScene}.json`).then(r => r.json())
  return { project, scene }
}

async function openOrUpdatePreview() {
  const payload = await loadProject()

  PreviewPopup:
  if (previewWindow.value && !previewWindow.value.closed) {
    previewWindow.value.postMessage({ type: "projectData", payload }, "*")
    break PreviewPopup
  }

  previewWindow.value = window.open(
    "/preview/preview.html",
    "LupisPreview",
    "width=960,height=540,resizable=yes"
  )

  const sendCheck = setInterval(() => {
    if (!previewWindow.value) return
    previewWindow.value.postMessage({ type: "projectData", payload }, "*")
    clearInterval(sendCheck)
  }, 250)
}

function onPreviewClosed(cb) {
  onCloseCallbacks.push(cb)
}

setInterval(() => {
  if (previewWindow.value && previewWindow.value.closed) {
    previewWindow.value = null
    onCloseCallbacks.forEach(cb => cb())
  }
}, 500)

onMounted(async () => {
  await nextTick()
  startEngine("glCanvas", "editor", "/projects/ProjectTemplate/")
})

defineExpose({ openOrUpdatePreview, onPreviewClosed })
</script>
