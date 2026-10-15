<template>
  <div class="w-full h-full flex flex-col bg-[#1e1e1e] text-gray-300 font-mono text-sm select-none overflow-hidden">
    <!-- Top Editor Bar / Breadcrumbs & Status -->
    <div class="h-9 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between px-4 shrink-0 text-xs text-gray-400">
      <div class="flex items-center gap-2">
        <span class="text-pink-500 font-semibold">{{ scriptName }}</span>
        <span>/</span>
        <span class="text-gray-200 font-medium">{{ nodeTitle }}</span>
        
        <div class="h-4 w-[1px] bg-[#3c3c3c] mx-1"></div>

        <!-- Auto Save Status Indicator -->
        <div class="flex items-center gap-1.5 font-sans text-[11px]">
          <span 
            class="px-2 py-0.5 rounded font-medium transition-colors duration-200 flex items-center gap-1.5"
            :class="isDirty ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'"></span>
            {{ isDirty ? 'Saving...' : 'Synced' }}
          </span>
        </div>

        <!-- Validation Status Badges -->
        <div class="flex items-center gap-1.5 ml-1 font-sans text-[10px]">
          <span 
            v-if="validationResult.isValid" 
            class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium"
          >
            ✓ No Issues
          </span>
          <span 
            v-else 
            class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium"
          >
            ⚠ Warnings ({{ validationResult.issues.length }})
          </span>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center gap-2 text-[11px]">
        <!-- Zoom Out / Zoom In Buttons -->
        <div class="flex items-center bg-zinc-800 rounded border border-zinc-700/60 overflow-hidden font-sans">
          <button 
            @click="zoomOut" 
            :disabled="zoomLevel <= 70"
            title="Zoom Out (-10%)"
            class="px-2 py-1 hover:bg-zinc-700 disabled:opacity-40 text-gray-300 transition-colors cursor-pointer disabled:cursor-not-allowed border-r border-zinc-700/60"
          >
            🔍 -
          </button>
          
          <button
            @click="resetZoom"
            title="Reset Zoom to 100%"
            class="px-2 py-1 hover:bg-zinc-700 text-gray-300 transition-colors text-[10px] font-mono"
          >
            {{ zoomLevel }}%
          </button>

          <button 
            @click="zoomIn" 
            :disabled="zoomLevel >= 200"
            title="Zoom In (+10%)"
            class="px-2 py-1 hover:bg-zinc-700 disabled:opacity-40 text-gray-300 transition-colors cursor-pointer disabled:cursor-not-allowed border-l border-zinc-700/60"
          >
            🔍 +
          </button>
        </div>

        <div class="h-4 w-[1px] bg-[#3c3c3c] mx-0.5"></div>

        <!-- Reset Code Button -->
        <button 
          @click="resetCode" 
          :disabled="!targetNode"
          class="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white rounded font-sans transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Reset Code
        </button>

        <div class="h-4 w-[1px] bg-[#3c3c3c] mx-1"></div>
        <span>UTF-8</span>
        <span>JavaScript</span>
      </div>
    </div>

    <!-- Main Workspace Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Line Numbers Area (Mengikuti skala ukuran font) -->
      <div 
        class="w-12 bg-[#1e1e1e] border-r border-[#2d2d2d] py-3 text-right pr-3 select-none text-gray-600 font-mono text-xs leading-6 shrink-0"
        :style="{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px` }"
      >
        <div v-for="line in lineCount" :key="line">{{ line }}</div>
      </div>

      <!-- Code Textarea & Syntax Highlighting Overlay Area -->
      <div class="flex-1 relative bg-[#1e1e1e] flex flex-col overflow-hidden">
        <div v-if="targetNode" class="relative flex-1 w-full h-full overflow-auto">
          <!-- Formatted / Colored Code Layer (Underneath) -->
          <pre 
            ref="highlightRef"
            aria-hidden="true" 
            class="syntax-highlight-overlay absolute inset-0 m-0 p-3 pointer-events-none font-mono text-xs leading-6 whitespace-pre font-normal bg-transparent overflow-hidden"
            :style="{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px` }"
            v-html="highlightedCode"
          ></pre>

          <textarea
            ref="textareaRef"
            v-model="codeContent"
            spellcheck="false"
            placeholder="// Write your node logic here..."
            class="code-textarea absolute inset-0 w-full h-full bg-transparent p-3 outline-none resize-none font-mono text-xs leading-6 selection:bg-[#264f78] placeholder:text-gray-600 font-normal whitespace-pre overflow-auto"
            :style="{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px` }"
            @input="handleCodeInput"
            @keydown="handleEditorKeyDown"
            @scroll="syncScroll"
          ></textarea>
        </div>
        
        <!-- Fallback view if node is missing -->
        <div v-else class="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-xs gap-2 select-none">
          <span>Node not found or has been deleted.</span>
          <span class="text-[10px] font-mono text-zinc-600">Tab ID: {{ activeTabId }}</span>
        </div>

        <!-- Real-Time Port & Variable Validation Panel -->
        <div 
          v-if="targetNode && !validationResult.isValid"
          class="border-t border-amber-500/30 bg-[#252218] p-2.5 px-4 text-xs font-sans text-amber-200 shrink-0 max-h-36 overflow-y-auto z-10"
        >
          <div class="font-semibold text-amber-400 mb-1 flex items-center justify-between">
            <span>Validation Warnings:</span>
            <span class="text-[10px] text-zinc-400 font-mono">
              Ports — Inputs: {{ dataInputPorts.length }} | Outputs: {{ definedOutputPorts.length }}
            </span>
          </div>
          <ul class="list-disc list-inside space-y-0.5 text-[11px] text-amber-300/90 font-mono">
            <li v-for="(issue, idx) in validationResult.issues" :key="idx">
              {{ issue }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- IDE Bottom Status Bar -->
    <div 
      class="h-6 text-white px-3 flex items-center justify-between text-[11px] shrink-0 font-sans transition-colors duration-200 z-10"
      :class="!validationResult.isValid ? 'bg-zinc-800 border-t border-amber-500/40 text-amber-300' : 'bg-[#007acc]'"
    >
      <div class="flex items-center gap-4">
        <span class="font-medium">Node Name: {{ nodeTitle }}</span>
        <span v-if="targetNode" class="font-mono">
          Inputs: {{ validationResult.usedInputsCount }}/{{ dataInputPorts.length }} | 
          Outputs: {{ validationResult.usedOutputsCount }}/{{ definedOutputPorts.length }} | 
          Vars Used: {{ validationResult.usedVarsCount }}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <span>Zoom: {{ zoomLevel }}%</span>
        <span>Spaces: 2</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'

import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useScriptStore } from '@scripts/scripts.js'
import { useProjectStore } from '@projects/projects.js'
import { useCodeHistory } from '@historys/historys.js'

const workspaceStore = useWorkspaceStore()
const scriptStore = useScriptStore()
const projectStore = useProjectStore()

const textareaRef = ref(null)
const highlightRef = ref(null)

const zoomLevel = ref(100) 
const baseFontSize = 12 
const baseLineHeight = 24 

const fontSize = computed(() => Math.round((baseFontSize * zoomLevel.value) / 100))
const lineHeight = computed(() => Math.round((baseLineHeight * zoomLevel.value) / 100))

const zoomIn = () => {
  if (zoomLevel.value < 200) {
    zoomLevel.value += 10
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 70) {
    zoomLevel.value -= 10
  }
}

const resetZoom = () => {
  zoomLevel.value = 100
}

const activeTabId = computed(() => workspaceStore.activeTab?.id || '')

const extractedNodeId = computed(() => {
  if (activeTabId.value.startsWith('code_')) {
    return activeTabId.value.slice(5)
  }
  return activeTabId.value
})

const targetNode = computed(() => {
  if (!scriptStore.activeScript || !extractedNodeId.value) return null
  return scriptStore.activeScript.nodes.find(n => n.id === extractedNodeId.value)
})

const scriptName = computed(() => scriptStore.activeScript?.name || 'Script')
const nodeTitle = computed(() => targetNode.value?.settings?.headerTitle || targetNode.value?.label || 'Node')

watch(
  () => [scriptStore.activeScript?.nodes, extractedNodeId.value],
  () => {
    if (workspaceStore.activeTab?.type === 'code_editor' && extractedNodeId.value) {
      const nodeExists = scriptStore.activeScript?.nodes.some(n => n.id === extractedNodeId.value)
      if (!nodeExists) {
        workspaceStore.closeTab(activeTabId.value)
      }
    }
  },
  { deep: true, immediate: true }
)

const {
  codeContent,
  isDirty,
  handleCodeInput,
  resetCode,
  handleEditorKeyDown
} = useCodeHistory(extractedNodeId, targetNode, { debounceMs: 800 })

const highlightedCode = computed(() => {
  const code = codeContent.value || ''
  if (!code) return '<br/>'
  const html = Prism.highlight(code, Prism.languages.javascript, 'javascript')
  return html.endsWith('\n') ? html + '<br/>' : html
})

const syncScroll = () => {
  if (textareaRef.value && highlightRef.value) {
    highlightRef.value.scrollTop = textareaRef.value.scrollTop
    highlightRef.value.scrollLeft = textareaRef.value.scrollLeft
  }
}

const dataInputPorts = computed(() => {
  if (!targetNode.value || !Array.isArray(targetNode.value.inputs)) return []
  return targetNode.value.inputs.filter(p => {
    const dType = String(p.dataType || '').toLowerCase()
    const pId = String(p.id || '').toLowerCase()
    return dType !== 'execution'
  })
})

const definedOutputPorts = computed(() => {
  if (!targetNode.value || !Array.isArray(targetNode.value.outputs)) return []
  return targetNode.value.outputs
})

const definedLocalVars = computed(() => {
  if (!scriptStore.activeScript || !Array.isArray(scriptStore.activeScript.localVariables)) return []
  return scriptStore.activeScript.localVariables.flatMap(v => [v.name, v.id]).filter(Boolean)
})

const definedGlobalVars = computed(() => {
  const globals = projectStore.activeProject?.globalVariables || []
  return globals.flatMap(v => [v.name, v.id]).filter(Boolean)
})

const validationResult = computed(() => {
  if (!targetNode.value) return { isValid: true, issues: [], usedInputsCount: 0, usedOutputsCount: 0, usedVarsCount: 0 }

  const code = codeContent.value
  const issues = []

  const inputMatches = [
    ...[...code.matchAll(/inputs\[\s*['"]([^'"]+)['"]\s*\]/g)].map(m => m[1]),
    ...[...code.matchAll(/inputs\.([A-Za-z0-9_$]+)/g)].map(m => m[1])
  ]
  const usedInputKeys = [...new Set(inputMatches)]

  const outputMatches = [
    ...[...code.matchAll(/outputs\[\s*['"]([^'"]+)['"]\s*\]/g)].map(m => m[1]),
    ...[...code.matchAll(/outputs\.([A-Za-z0-9_$]+)\s*=/g)].map(m => m[1])
  ]
  const usedOutputKeys = [...new Set(outputMatches)]

  const allValidInputIdentifiers = targetNode.value.inputs?.flatMap(p => [p.label, p.id]).filter(Boolean) || []
  const allValidOutputIdentifiers = targetNode.value.outputs?.flatMap(p => [p.label, p.id]).filter(Boolean) || []

  usedInputKeys.forEach(inputKey => {
    if (!allValidInputIdentifiers.includes(inputKey)) {
      issues.push(`Input '${inputKey}' is used in code, but is not defined in Node Input Ports.`)
    }
  })

  usedOutputKeys.forEach(outputKey => {
    if (!allValidOutputIdentifiers.includes(outputKey)) {
      issues.push(`Output '${outputKey}' is set in code, but is not defined in Node Output Ports.`)
    }
  })

  let matchedInputsCount = 0
  dataInputPorts.value.forEach(port => {
    const isUsed = usedInputKeys.includes(port.label) || usedInputKeys.includes(port.id)
    if (isUsed) {
      matchedInputsCount++
    } else {
      issues.push(`Input Port '${port.label || port.id}' is defined on node, but never read in code.`)
    }
  })

  let matchedOutputsCount = 0
  definedOutputPorts.value.forEach(port => {
    const isUsed = usedOutputKeys.includes(port.label) || usedOutputKeys.includes(port.id)
    if (isUsed) {
      matchedOutputsCount++
    } else {
      issues.push(`Output Port '${port.label || port.id}' is defined on node, but never set in code.`)
    }
  })

  const localGetMatches = [...code.matchAll(/context\.getLocal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1])
  const localSetMatches = [...code.matchAll(/context\.setLocal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1])
  const usedLocalVars = [...new Set([...localGetMatches, ...localSetMatches])]

  const globalGetMatches = [...code.matchAll(/context\.getGlobal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1])
  const globalSetMatches = [...code.matchAll(/context\.setGlobal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1])
  const usedGlobalVars = [...new Set([...globalGetMatches, ...globalSetMatches])]

  usedLocalVars.forEach(varKey => {
    if (!definedLocalVars.value.includes(varKey)) {
      issues.push(`Local Variable '${varKey}' is referenced in code, but not defined in Script Variables.`)
    }
  })

  usedGlobalVars.forEach(varKey => {
    if (!definedGlobalVars.value.includes(varKey)) {
      issues.push(`Global Variable '${varKey}' is referenced in code, but not defined in Project Global Variables.`)
    }
  })

  return {
    isValid: issues.length === 0,
    issues,
    usedInputsCount: matchedInputsCount,
    usedOutputsCount: matchedOutputsCount,
    usedVarsCount: usedLocalVars.length + usedGlobalVars.length
  }
})

const lineCount = computed(() => {
  const lines = codeContent.value.split('\n').length
  return Math.max(lines, 25)
})
</script>

<style scoped>
.code-textarea {
  color: transparent !important;
  caret-color: #ffffff;
}

:deep(.token.comment),
:deep(.token.prolog),
:deep(.token.doctype),
:deep(.token.cdata) {
  color: #6a9955;
  font-style: italic;
}

:deep(.token.punctuation) {
  color: #d4d4d4;
}

:deep(.token.property),
:deep(.token.tag),
:deep(.token.boolean),
:deep(.token.number),
:deep(.token.constant),
:deep(.token.symbol),
:deep(.token.deleted) {
  color: #b5cea8;
}

:deep(.token.selector),
:deep(.token.attr-name),
:deep(.token.string),
:deep(.token.char),
:deep(.token.builtin),
:deep(.token.inserted) {
  color: #ce9178;
}

:deep(.token.operator),
:deep(.token.entity),
:deep(.token.url),
:deep(.language-css .token.string),
:deep(.style .token.string) {
  color: #d4d4d4;
}

:deep(.token.atrule),
:deep(.token.attr-value),
:deep(.token.keyword) {
  color: #569cd6;
}

:deep(.token.function),
:deep(.token.class-name) {
  color: #dcdcaa;
}

:deep(.token.regex),
:deep(.token.important),
:deep(.token.variable) {
  color: #d16969;
}
</style>