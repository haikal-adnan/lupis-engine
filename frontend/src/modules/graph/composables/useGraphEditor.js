import { ref, shallowReactive, computed, nextTick } from 'vue'
import { useScriptStore } from '@/stores/useScriptStore'
import { storeToRefs } from 'pinia'
import { GenerateUUID } from '@/commons/utils/generateUUID.js'

const GRID_SIZE = 24
const NODE_WIDTH = 200
const HEADER_HEIGHT = 32
const BODY_PADDING_TOP = 12
const PORT_HEIGHT = 24

// Konstanta Zoom Baru
const MIN_ZOOM = 0.25
const MAX_ZOOM = 5.0
const ZOOM_SPEED = 0.1

const getVarColor = (type) => {
  switch (type) {
    case 'String': return '#9c27b0';
    case 'Number': return '#00e676';
    case 'Boolean': return '#f44336';
    case 'Vector': return '#FFC107';
    default: return '#777';
  }
};

export function useGraphEditor() {
  const panelRef = ref(null)
  const store = useScriptStore()
  
  const { activeScript, selectedNodeId } = storeToRefs(store)

  const nodes = computed(() => activeScript.value?.nodes || [])
  const edges = computed(() => activeScript.value?.edges || [])

  const camera = shallowReactive({ x: 0, y: 0, scale: 1 })
  
  let cachedRect = null

  const interaction = shallowReactive({
    mode: null,
    activeId: null,
    activeHandle: null,
    hoveredId: null,
    startMouse: { x: 0, y: 0 },
    startCam: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 },
    tempParams: null,
    dragPos: { x: 0, y: 0 }
  })

  const getClientPos = (e) => {
    if (!cachedRect && panelRef.value) cachedRect = panelRef.value.getBoundingClientRect()
    const r = cachedRect || { left: 0, top: 0 }
    return {
      x: (e.clientX - r.left - camera.x) / camera.scale,
      y: (e.clientY - r.top - camera.y) / camera.scale
    }
  }

  const snap = (val) => (val / GRID_SIZE | 0) * GRID_SIZE

  const getPortPos = (nodeId, portId) => {
    let node = nodes.value.find(n => n._id === nodeId)
    if (!node) return { x: 0, y: 0 }

    let nodeX = node.position.x
    let nodeY = node.position.y
    
    if (interaction.mode === 'drag' && interaction.activeId === nodeId) {
       nodeX = interaction.dragPos.x
       nodeY = interaction.dragPos.y
    }

    let index = node.outputs?.findIndex(p => p._id === portId)
    if (index !== undefined && index !== -1) {
      return {
        x: nodeX + NODE_WIDTH,
        y: nodeY + HEADER_HEIGHT + BODY_PADDING_TOP + (index * PORT_HEIGHT) + 6
      }
    }

    index = node.inputs?.findIndex(p => p._id === portId)
    if (index !== undefined && index !== -1) {
      return {
        x: nodeX,
        y: nodeY + HEADER_HEIGHT + BODY_PADDING_TOP + (index * PORT_HEIGHT) + 6
      }
    }
    
    return { x: nodeX + (NODE_WIDTH / 2), y: nodeY + HEADER_HEIGHT }
  }

  const onDrop = (event) => {
    const worldPos = getClientPos(event)
    const finalPos = { x: snap(worldPos.x), y: snap(worldPos.y) }

    const varJson = event.dataTransfer.getData('application/script-variable')
    if (varJson) {
      try {
        const variable = JSON.parse(varJson)
        const isSetter = event.altKey; 
        
        const newNodePayload = {
            _id: GenerateUUID(),
            type: isSetter ? 'variable_set' : 'variable_get',
            label: isSetter ? `Set ${variable.name}` : `Get ${variable.name}`,
            position: finalPos,
            data: {
                variableId: variable._id,
                scope: variable.scope
            },
            settings: {
                headerTitle: isSetter ? `Set ${variable.name}` : `Get ${variable.name}`,
                headerColor: getVarColor(variable.type),
                category: 'Variable'
            }
        }

        if (isSetter) {
            newNodePayload.inputs = [
                { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#fff' },
                { _id: 'val_in', label: 'Value', dataType: variable.type.toLowerCase(), color: getVarColor(variable.type) }
            ];
            newNodePayload.outputs = [
                { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#fff' },
                { _id: 'val_out', label: 'Value', dataType: variable.type.toLowerCase(), color: getVarColor(variable.type) }
            ];
        } else {
            newNodePayload.inputs = [];
            newNodePayload.outputs = [
                { _id: 'val_out', label: 'Value', dataType: variable.type.toLowerCase(), color: getVarColor(variable.type) }
            ];
        }

        store.addNodeToActive(newNodePayload)
        return;
      } catch (err) {
        console.error(err)
      }
    }

    const templateJson = event.dataTransfer.getData('application/node-template')
    if (templateJson) {
      try {
        const template = JSON.parse(templateJson)
        const newNodePayload = {
          _id: GenerateUUID(),
          type: template.type,
          name: template.label,
          position: finalPos,
          ...template.defaultData
        }
        store.addNodeToActive(newNodePayload)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const onCanvasMouseDown = (e) => {
    if (e.button === 0) {
      store.setSelectedNode(null)
      interaction.activeId = null
    }
  }

  const startDragNode = (e, node) => {
    if (e.button !== 0) return
    e.preventDefault() 
    e.stopPropagation() 
    
    store.setSelectedNode(node._id) 
    cachedRect = panelRef.value.getBoundingClientRect()
    
    interaction.mode = 'drag'
    interaction.activeId = node._id
    interaction.dragPos = { ...node.position }
    
    const world = getClientPos(e)
    
    interaction.dragOffset = {
      x: node.position.x - world.x,
      y: node.position.y - world.y
    }
  }

  const startConnect = (e, nodeId, handleId) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    
    cachedRect = panelRef.value.getBoundingClientRect()
    
    interaction.mode = 'connect'
    interaction.activeId = nodeId
    interaction.activeHandle = handleId
    
    interaction.tempParams = {
      p1: getPortPos(nodeId, handleId),
      p2: getClientPos(e)
    }
  }

  const handleGlobalMouseMove = (e) => {
    if (!interaction.mode) return
    e.preventDefault()

    if (interaction.mode === 'pan') {
      camera.x = interaction.startCam.x + (e.clientX - interaction.startMouse.x)
      camera.y = interaction.startCam.y + (e.clientY - interaction.startMouse.y)
    } else if (interaction.mode === 'drag') {
      const world = getClientPos(e)
      interaction.dragPos = {
        x: snap(world.x + interaction.dragOffset.x),
        y: snap(world.y + interaction.dragOffset.y)
      }
    } else if (interaction.mode === 'connect') {
      interaction.tempParams = {
        ...interaction.tempParams,
        p2: getClientPos(e)
      }
    }
  }

  const handleGlobalMouseUp = () => {
    if (interaction.mode === 'drag' && interaction.activeId) {
       store.updateNodeInActive(interaction.activeId, { position: interaction.dragPos })
    }

    interaction.mode = null
    interaction.activeId = null
    interaction.activeHandle = null
    interaction.tempParams = null
    cachedRect = null 
  }

  const endConnect = (targetNodeId, targetPortId) => {
    if (interaction.mode !== 'connect') return
    
    const sourceNodeId = interaction.activeId
    const sourcePortId = interaction.activeHandle
    
    if (sourceNodeId !== targetNodeId && targetPortId) {
       store.addEdgeToActive({
         _id: `e_${Date.now()}`,
         source: sourceNodeId,
         sourceHandle: sourcePortId,
         target: targetNodeId,
         targetHandle: targetPortId
       })
    }
    
    handleGlobalMouseUp()
  }

  const isRelated = (targetId) => {
    const subjectId = interaction.hoveredId || selectedNodeId.value
    if (!subjectId) return true
    if (subjectId === targetId) return true

    const targetEdge = edges.value.find(e => e._id === targetId)
    if (targetEdge) {
      return targetEdge.source === subjectId || targetEdge.target === subjectId
    }

    const connectedEdge = edges.value.find(e => 
      (e.source === subjectId && e.target === targetId) || 
      (e.target === subjectId && e.source === targetId)
    )
    return !!connectedEdge
  }
  
  // ----------------------------------------------------------------------
  // UPDATE: Logic Pan & Zoom Baru (Mirip CameraController)
  // ----------------------------------------------------------------------
  const handleWheel = (e) => {
    if (e.ctrlKey) e.preventDefault() // Mencegah browser zoom default
    
    if (!panelRef.value) return
    
    // Update rect cache jika perlu
    if (!cachedRect) cachedRect = panelRef.value.getBoundingClientRect()
    const rect = cachedRect

    // 1. Logic Pan (Shift / Alt)
    // Dibagi dengan scale agar kecepatan pan terasa konsisten pada level zoom berapapun
    if (e.shiftKey) {
      camera.y -= e.deltaY / camera.scale
      return
    }

    if (e.altKey) {
      camera.x -= e.deltaY / camera.scale // deltaY digunakan untuk scroll horizontal
      return
    }

    // 2. Logic Zoom Towards Pointer
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Tentukan arah dan intensitas zoom
    const delta = e.deltaY < 0 ? 1 : -1
    const oldScale = camera.scale
    let newScale = oldScale * (1 + (delta * ZOOM_SPEED))

    // Batasi Zoom
    newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale))

    if (newScale === oldScale) return

    // Hitung posisi mouse di "Dunia" sebelum zoom berubah
    const worldX = (mouseX - camera.x) / oldScale
    const worldY = (mouseY - camera.y) / oldScale

    // Terapkan scale baru
    camera.scale = newScale

    // Sesuaikan posisi kamera (x, y) agar titik dunia tetap di bawah kursor
    camera.x = mouseX - (worldX * newScale)
    camera.y = mouseY - (worldY * newScale)

    nextTick(() => { cachedRect = panelRef.value?.getBoundingClientRect() })
  }

  const startPan = (e) => {
    interaction.mode = 'pan'
    interaction.startMouse = { x: e.clientX, y: e.clientY }
    interaction.startCam = { x: camera.x, y: camera.y }
  }

  const getPathD = (p1, p2) => {
    const dist = Math.abs(p1.x - p2.x)
    const controlDist = Math.min(dist * 0.5, 150)
    const isBackwards = p2.x < p1.x
    const finalControl = isBackwards ? Math.max(controlDist, 120) : controlDist
    return `M ${p1.x} ${p1.y} C ${p1.x + finalControl} ${p1.y}, ${p2.x - finalControl} ${p2.y}, ${p2.x} ${p2.y}`
  }

  const getEdgeData = (edge) => {
    const p1 = getPortPos(edge.source, edge.sourceHandle)
    const p2 = getPortPos(edge.target, edge.targetHandle)
    return { path: getPathD(p1, p2) }
  }

  return {
    panelRef, 
    camera, 
    nodes, 
    edges, 
    interaction, 
    selectedNodeId,
    handleWheel, 
    startPan, 
    startDragNode, 
    startConnect, 
    endConnect, 
    handleGlobalMouseMove, 
    handleGlobalMouseUp, 
    onCanvasMouseDown,
    onDrop,
    store, 
    getEdgeData, 
    getPathD, 
    isRelated, 
    GRID_SIZE
  }
}