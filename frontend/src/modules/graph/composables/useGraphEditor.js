import { ref, shallowReactive, computed, nextTick } from 'vue'
import { useScriptStore } from '@/stores/useScriptStore'
import { storeToRefs } from 'pinia'

const GRID_SIZE = 24
const NODE_WIDTH = 200
const HEADER_HEIGHT = 32
const BODY_PADDING_TOP = 12
const PORT_HEIGHT = 24

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
    tempParams: null
  })

  // --- HELPERS ---
  const getClientPos = (e) => {
    // Pastikan rect selalu update jika null
    if (!cachedRect && panelRef.value) cachedRect = panelRef.value.getBoundingClientRect()
    const r = cachedRect || { left: 0, top: 0 }
    return {
      x: (e.clientX - r.left - camera.x) / camera.scale,
      y: (e.clientY - r.top - camera.y) / camera.scale
    }
  }

  const snap = (val) => (val / GRID_SIZE | 0) * GRID_SIZE

  const getPortPos = (nodeId, portId) => {
    const node = nodes.value.find(n => n._id === nodeId)
    if (!node) return { x: 0, y: 0 }

    let index = node.outputs.findIndex(p => p._id === portId)
    if (index !== -1) {
      return {
        x: node.position.x + NODE_WIDTH,
        y: node.position.y + HEADER_HEIGHT + BODY_PADDING_TOP + (index * PORT_HEIGHT) + 6
      }
    }

    index = node.inputs.findIndex(p => p._id === portId)
    if (index !== -1) {
      return {
        x: node.position.x,
        y: node.position.y + HEADER_HEIGHT + BODY_PADDING_TOP + (index * PORT_HEIGHT) + 6
      }
    }
    return { x: node.position.x + (NODE_WIDTH / 2), y: node.position.y + HEADER_HEIGHT }
  }

  // --- INTERACTIONS ---

  const onCanvasMouseDown = (e) => {
    // Hanya proses klik kiri
    if (e.button === 0) {
      // Fitur Unselect: Jika klik di canvas kosong, hilangkan seleksi
      store.setSelectedNode(null)
      interaction.activeId = null
    }
  }

  const startDragNode = (e, node) => {
    if (e.button !== 0) return
    
    // [FIX UTAMA]: Mencegah native drag browser (ghost image)
    // Ini membuat mousemove tetap realtime di lahan kosong
    e.preventDefault() 
    e.stopPropagation() 
    
    store.setSelectedNode(node._id) 
    cachedRect = panelRef.value.getBoundingClientRect()
    
    interaction.mode = 'drag'
    interaction.activeId = node._id
    
    const world = getClientPos(e)
    interaction.dragOffset = {
      x: node.position.x - world.x,
      y: node.position.y - world.y
    }
  }

  const startConnect = (e, nodeId, handleId) => {
    if (e.button !== 0) return
    
    // [FIX]: Mencegah seleksi teks saat menarik garis
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

    // [FIX]: Mencegah side-effect browser lain saat sedang interaksi
    e.preventDefault()

    if (interaction.mode === 'pan') {
      camera.x = interaction.startCam.x + (e.clientX - interaction.startMouse.x)
      camera.y = interaction.startCam.y + (e.clientY - interaction.startMouse.y)
    } 
    else if (interaction.mode === 'drag') {
      const world = getClientPos(e)
      const newPos = {
        x: snap(world.x + interaction.dragOffset.x),
        y: snap(world.y + interaction.dragOffset.y)
      }
      store.updateNodeInActive(interaction.activeId, { position: newPos })
    } 
    else if (interaction.mode === 'connect') {
      interaction.tempParams.p2 = getClientPos(e)
    }
  }

  const handleGlobalMouseUp = () => {
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

  // --- LOGIC FOCUS / DIMMING ---
  const isRelated = (targetId) => {
    const subjectId = interaction.hoveredId || selectedNodeId.value;
    if (!subjectId) return true;
    if (subjectId === targetId) return true;

    const targetEdge = edges.value.find(e => e._id === targetId);
    if (targetEdge) {
      return targetEdge.source === subjectId || targetEdge.target === subjectId;
    }

    const connectedEdge = edges.value.find(e => 
      (e.source === subjectId && e.target === targetId) || 
      (e.target === subjectId && e.source === targetId)
    );
    
    return !!connectedEdge;
  }
  
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const s = e.deltaY > 0 ? 0.9 : 1.1
      camera.scale = Math.min(Math.max(camera.scale * s, 0.2), 3)
    } else {
      camera.x -= e.deltaX
      camera.y -= e.deltaY
    }
    nextTick(() => { cachedRect = panelRef.value?.getBoundingClientRect() })
  }

  const startPan = (e) => {
    interaction.mode = 'pan'
    interaction.startMouse = { x: e.clientX, y: e.clientY }
    interaction.startCam = { x: camera.x, y: camera.y }
  }

  const getEdgeData = (edge) => {
    const p1 = getPortPos(edge.source, edge.sourceHandle)
    const p2 = getPortPos(edge.target, edge.targetHandle)
    const dist = Math.abs(p1.x - p2.x)
    const controlDist = Math.min(dist * 0.5, 150)
    const isBackwards = p2.x < p1.x
    const finalControl = isBackwards ? Math.max(controlDist, 120) : controlDist
    const path = `M ${p1.x} ${p1.y} C ${p1.x + finalControl} ${p1.y}, ${p2.x - finalControl} ${p2.y}, ${p2.x} ${p2.y}`
    return { path }
  }

  const getPathD = (p1, p2) => {
    const dist = Math.abs(p1.x - p2.x)
    const controlDist = Math.min(dist * 0.5, 150)
    const isBackwards = p2.x < p1.x
    const finalControl = isBackwards ? Math.max(controlDist, 120) : controlDist
    return `M ${p1.x} ${p1.y} C ${p1.x + finalControl} ${p1.y}, ${p2.x - finalControl} ${p2.y}, ${p2.x} ${p2.y}`
  }

  return {
    panelRef, camera, nodes, edges, interaction, selectedNodeId,
    handleWheel, startPan, startDragNode, startConnect, endConnect, 
    handleGlobalMouseMove, handleGlobalMouseUp, 
    onCanvasMouseDown, 
    store, 
    getEdgeData, getPathD, isRelated, GRID_SIZE
  }
}