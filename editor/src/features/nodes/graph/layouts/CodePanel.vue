<template>
  <div class="w-full h-full flex flex-col bg-[#1e1e1e] text-gray-300 font-mono text-sm select-none overflow-hidden">
    <!-- Top Editor Bar / Breadcrumb & Status -->
    <div class="h-9 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between px-4 shrink-0 text-xs text-gray-400">
      <div class="flex items-center gap-2">
        <span class="text-pink-500 font-semibold">{{ scriptName }}</span>

        <div class="h-4 w-[1px] bg-[#3c3c3c] mx-1"></div>

        <!-- Auto Save / Synced Status Indicator -->
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
            v-if="validationResult.hasSyntaxError" 
            class="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-medium"
          >
            Syntax Error
          </span>
          <span 
            v-else-if="validationResult.isValid" 
            class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium"
          >
            No Issues
          </span>
          <span 
            v-else 
            class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium"
          >
            Warnings ({{ validationResult.issues.length }})
          </span>
        </div>
      </div>
      
      <!-- Right Actions: Reset Code -->
      <div class="flex items-center gap-2 text-[11px]">
        <!-- Reset Code Button -->
        <button 
          @click="handleResetCode" 
          :disabled="!targetNode || isReadOnly"
          class="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white rounded font-sans transition-colors cursor-pointer disabled:cursor-not-allowed"
          data-testid="codepanel-reset-code-btn"
        >
          Reset Code
        </button>
      </div>
    </div>

    <!-- Main Workspace Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Line Numbers Area (Mengikuti skala ukuran font dari preference) -->
      <div 
        ref="lineNumbersRef"
        class="w-12 bg-[#1e1e1e] border-r border-[#2d2d2d] py-3 text-right pr-3 select-none text-gray-600 font-mono text-xs shrink-0 overflow-hidden"
        :style="{ fontSize: `${fontSize}px` }"
      >
        <div 
          v-for="line in lineCount" 
          :key="line"
          :style="{ height: `${lineHeight}px`, lineHeight: `${lineHeight}px` }"
        >
          {{ line }}
        </div>
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
            :readonly="isReadOnly"
            spellcheck="false"
            placeholder="// Write your node logic here..."
            class="code-textarea absolute inset-0 w-full h-full bg-transparent p-3 outline-none resize-none font-mono text-xs leading-6 selection:bg-[#264f78] placeholder:text-gray-600 font-normal whitespace-pre overflow-auto"
            :class="{ 'cursor-not-allowed select-text opacity-85': isReadOnly }"
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
          class="border-t p-2.5 px-4 text-xs font-sans shrink-0 max-h-36 overflow-y-auto z-10 transition-colors duration-200"
          :class="validationResult.hasSyntaxError ? 'border-red-500/40 bg-[#2d1b1b] text-red-200' : 'border-amber-500/30 bg-[#252218] text-amber-200'"
        >
          <div class="font-semibold mb-1 flex items-center justify-between" :class="validationResult.hasSyntaxError ? 'text-red-400' : 'text-amber-400'">
            <span>{{ validationResult.hasSyntaxError ? 'Syntax Errors & Issues:' : 'Validation Warnings:' }}</span>
            <span class="text-[10px] text-zinc-400 font-mono">
              Ports — Inputs: {{ dataInputPorts.length }} | Outputs: {{ definedOutputPorts.length }}
            </span>
          </div>
          <ul class="list-disc list-inside space-y-0.5 text-[11px] font-mono" :class="validationResult.hasSyntaxError ? 'text-red-300/90' : 'text-amber-300/90'">
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
      :class="validationResult.hasSyntaxError ? 'bg-red-950/80 border-t border-red-500/50 text-red-300' : (!validationResult.isValid ? 'bg-zinc-800 border-t border-amber-500/40 text-amber-300' : 'bg-[#007acc]')"
    >
      <div class="flex items-center gap-4">
        <span class="font-medium" data-testid="codepanel-bottom-node-title">Node: {{ nodeTitle }}</span>
        <span v-if="targetNode" class="font-mono opacity-80 text-[10px]">
          Inputs: {{ validationResult.usedInputsCount }}/{{ dataInputPorts.length }} | 
          Outputs: {{ validationResult.usedOutputsCount }}/{{ definedOutputPorts.length }}
        </span>
      </div>

      <!-- Right Side: System Node (Read Only) with Unlock Icon or Custom Node -->
      <div class="flex items-center gap-2">
        <template v-if="!isCustomNode">
          <span class="flex items-center gap-1.5 opacity-90 text-[11px]" data-testid="codepanel-system-node-indicator">
            <Lock class="w-3 h-3 text-blue-200" />
            <span>System Node (Read Only)</span>
          </span>
          <button 
            type="button"
            @click="unlockNode"
            title="Unlock to Custom Node"
            class="flex items-center gap-1 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white font-medium text-[10px] transition-colors cursor-pointer"
            data-testid="codepanel-unlock-btn"
          >
            <Unlock class="w-3 h-3" />
            <span>Unlock</span>
          </button>
        </template>
        <template v-else>
          <span class="flex items-center gap-1.5 font-medium text-white/90 text-[11px]" data-testid="codepanel-custom-node-indicator">
            <Cpu class="w-3.5 h-3.5 text-purple-300" />
            <span>Custom Node</span>
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { Lock, Unlock, Cpu } from 'lucide-vue-next'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'

import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useScriptStore } from '@scripts/scripts.js'
import { useProjectStore } from '@projects/projects.js'
import { useCodeHistory } from '@historys/historys.js'
import { useConfirm, usePopAlert } from '@composables/composables.js'
import { validateCodePanelContract } from '@nodes/contract/codePanelContract.js'
import { isUserCustomNode } from '../../inspector/layouts/custom/index.js'

const workspaceStore = useWorkspaceStore()
const scriptStore = useScriptStore()
const projectStore = useProjectStore()
const confirmComposable = typeof useConfirm === 'function' ? useConfirm() : null
const confirm = confirmComposable?.confirm || (async () => true)
const { showPop } = usePopAlert()

const textareaRef = ref(null)
const highlightRef = ref(null)
const lineNumbersRef = ref(null)

const baseFontSize = 12 
const baseLineHeight = 24 

const zoomLevel = computed(() => {
  return Number(projectStore.activeProject?.settings?.codeEditor?.zoom ?? 100)
})

const fontSize = computed(() => Math.round((baseFontSize * zoomLevel.value) / 100))
const lineHeight = computed(() => Math.round((baseLineHeight * zoomLevel.value) / 100))

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

const isCustomNode = computed(() => {
  return isUserCustomNode(targetNode.value)
})

const isReadOnly = computed(() => {
  return !isCustomNode.value
})

const unlockNode = async () => {
  if (!targetNode.value) return
  const isConfirmed = await confirm({
    title: 'Unlock to Custom Node',
    message: 'Unlock this node to custom script? Its code will become fully editable.',
    confirmText: 'Unlock',
    cancelText: 'Cancel',
    type: 'warning'
  })
  if (isConfirmed) {
    scriptStore.updateNodeInActive(targetNode.value.id, {
      isCustomScript: true,
      originalType: targetNode.value.type
    })
    showPop({
      title: 'Node Code Unlocked',
      message: `Node "${nodeTitle.value}" has been unlocked to a Custom Node with fully editable code.`,
      type: 'success'
    })
  }
}

const handleResetCode = async () => {
  if (!targetNode.value || isReadOnly.value) return
  const isConfirmed = await confirm({
    title: 'Reset Code',
    message: 'Reset code to default blueprint code? Any unsaved edits will be lost.',
    confirmText: 'Reset',
    cancelText: 'Cancel',
    type: 'warning'
  })
  if (isConfirmed) {
    resetCode()
    showPop({
      title: 'Code Reset',
      message: `Code for node "${nodeTitle.value}" has been restored to default template.`,
      type: 'info'
    })
  }
}

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
  if (textareaRef.value) {
    if (highlightRef.value) {
      highlightRef.value.scrollTop = textareaRef.value.scrollTop
      highlightRef.value.scrollLeft = textareaRef.value.scrollLeft
    }
    if (lineNumbersRef.value) {
      lineNumbersRef.value.scrollTop = textareaRef.value.scrollTop
    }
  }
}

const dataInputPorts = computed(() => {
  if (!targetNode.value || !Array.isArray(targetNode.value.inputs)) return []
  return targetNode.value.inputs.filter(p => {
    const dType = String(p.dataType || '').toLowerCase()
    return dType !== 'execution'
  })
})

const definedOutputPorts = computed(() => {
  if (!targetNode.value || !Array.isArray(targetNode.value.outputs)) return []
  return targetNode.value.outputs
})

const validationResult = computed(() => {
  return validateCodePanelContract(codeContent.value, {
    node: targetNode.value,
    localVariables: scriptStore.activeScript?.localVariables || [],
    globalVariables: projectStore.activeProject?.globalVariables || []
  })
})

const lineCount = computed(() => {
  const lines = (codeContent.value || '').split('\n').length
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
