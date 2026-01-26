import { ref, shallowReactive, computed, nextTick } from 'vue'
import { useScriptStore } from '@/stores/useScriptStore'
import { storeToRefs } from 'pinia'
import { GenerateUUID } from '@/commons/utils/generateUUID.js'

const GRID_SIZE = 24
const NODE_WIDTH = 200
const HEADER_HEIGHT = 32
const BODY_PADDING_TOP = 12
const PORT_HEIGHT = 24

const MIN_ZOOM = 0.25
const MAX_ZOOM = 5.0
const ZOOM_SPEED = 0.1
const SNAP_THRESHOLD = 50

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
    activeType: null,
    hoveredId: null,
    startMouse: { x: 0, y: 0 },
    startCam: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 },
    tempParams: null,
    dragPos: { x: 0, y: 0 },
    candidate: null
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
        y: nodeY + HEADER_HEIGHT + BODY_PADDING_TOP + (index * PORT_HEIGHT) + 8
      }
    }

    index = node.inputs?.findIndex(p => p._id === portId)
    if (index !== undefined && index !== -1) {
      return {
        x: nodeX, 
        y: nodeY + HEADER_HEIGHT + BODY_PADDING_TOP + (index * PORT_HEIGHT) + 8
      }
    }
    
    return { x: nodeX + (NODE_WIDTH / 2), y: nodeY + HEADER_HEIGHT }
  }

  const startConnect = (e, nodeId, handleId, type = 'output') => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    
    cachedRect = panelRef.value.getBoundingClientRect()
    
    interaction.mode = 'connect'
    interaction.activeId = nodeId
    interaction.activeHandle = handleId
    interaction.activeType = type 
    interaction.candidate = null 
    
    interaction.tempParams = {
      p1: getPortPos(nodeId, handleId),
      p2: getClientPos(e)
    }
  }

  const startMoveEdge = (e, edge) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    store.removeEdgeFromActive(edge._id)

    startConnect(e, edge.source, edge.sourceHandle, 'output')
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
      const mousePos = getClientPos(e)
      
      let nearestDist = SNAP_THRESHOLD
      let foundCandidate = null
      let snapPos = mousePos

      for (const node of nodes.value) {
        if (node._id === interaction.activeId) continue 

        const targetPorts = interaction.activeType === 'output' 
          ? (node.inputs || []) 
          : (node.outputs || [])

        for (const port of targetPorts) {
           const portPos = getPortPos(node._id, port._id)
           const dist = Math.hypot(portPos.x - mousePos.x, portPos.y - mousePos.y)

           if (dist < nearestDist) {
             nearestDist = dist
             foundCandidate = { nodeId: node._id, portId: port._id }
             snapPos = portPos
           }
        }
      }

      interaction.candidate = foundCandidate
      
      if (interaction.tempParams) {
          interaction.tempParams = {
            ...interaction.tempParams,
            p2: snapPos
          }
      }
    }
  }

  const handleGlobalMouseUp = () => {
    if (interaction.mode === 'drag' && interaction.activeId) {
       store.updateNodeInActive(interaction.activeId, { position: interaction.dragPos })
    }

    if (interaction.mode === 'connect' && interaction.candidate) {
        const sourceNode = interaction.activeId
        const sourceHandle = interaction.activeHandle
        const targetNode = interaction.candidate.nodeId
        const targetHandle = interaction.candidate.portId

        let finalSource, finalSourceHandle, finalTarget, finalTargetHandle

        if (interaction.activeType === 'output') {
            finalSource = sourceNode
            finalSourceHandle = sourceHandle
            finalTarget = targetNode
            finalTargetHandle = targetHandle
        } else {
            finalSource = targetNode
            finalSourceHandle = targetHandle
            finalTarget = sourceNode
            finalTargetHandle = sourceHandle
        }

        store.addEdgeToActive({
            _id: `e_${Date.now()}`,
            source: finalSource,
            sourceHandle: finalSourceHandle,
            target: finalTarget,
            targetHandle: finalTargetHandle
        })
    }

    interaction.mode = null
    interaction.activeId = null
    interaction.activeHandle = null
    interaction.activeType = null
    interaction.candidate = null
    interaction.tempParams = null
    cachedRect = null 
  }

  const isRelated = (targetId) => {
    const subjectId = interaction.hoveredId || selectedNodeId.value
    if (!subjectId) return true
    
    if (subjectId === targetId) return true

    const connectedEdge = edges.value.find(e => 
      (e.source === subjectId && e.target === targetId) || 
      (e.target === subjectId && e.source === targetId)
    )
    return !!connectedEdge
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

  const onCanvasMouseDown = (e) => {
    if (e.button === 0) {
      store.setSelectedNode(null)
      interaction.activeId = null
    }
  }

  const handleWheel = (e) => {
    if (e.ctrlKey) e.preventDefault()
    if (!panelRef.value) return
    if (!cachedRect) cachedRect = panelRef.value.getBoundingClientRect()
    const rect = cachedRect

    if (e.shiftKey) { camera.y -= e.deltaY / camera.scale; return }
    if (e.altKey) { camera.x -= e.deltaY / camera.scale; return }

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const delta = e.deltaY < 0 ? 1 : -1
    const oldScale = camera.scale
    let newScale = oldScale * (1 + (delta * ZOOM_SPEED))
    newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale))
    if (newScale === oldScale) return

    const worldX = (mouseX - camera.x) / oldScale
    const worldY = (mouseY - camera.y) / oldScale
    camera.scale = newScale
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

  const onDrop = (event) => {
    const worldPos = getClientPos(event)
    const finalPos = { x: snap(worldPos.x), y: snap(worldPos.y) }

    const varJson = event.dataTransfer.getData('application/script-variable')
    if (varJson) {
      try {
        const variable = JSON.parse(varJson)
        const isSetter = event.altKey
        
        const newNodePayload = {
            _id: GenerateUUID(),
            type: isSetter ? 'variable_set' : 'variable_get',
            label: isSetter ? `Set ${variable.name}` : `Get ${variable.name}`,
            position: finalPos,
            data: { variableId: variable._id, scope: variable.scope },
            settings: { 
                headerTitle: isSetter ? `Set ${variable.name}` : `Get ${variable.name}`,
                headerColor: '#777',
                category: 'Variable'
            }
        }

        if (isSetter) {
            newNodePayload.inputs = [
                { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#fff' },
                { _id: 'val_in', label: 'Value', dataType: variable.type.toLowerCase(), color: '#777' }
            ]
            newNodePayload.outputs = [
                { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#fff' },
                { _id: 'val_out', label: 'Value', dataType: variable.type.toLowerCase(), color: '#777' }
            ]
        } else {
            newNodePayload.inputs = []
            newNodePayload.outputs = [
                { _id: 'val_out', label: 'Value', dataType: variable.type.toLowerCase(), color: '#777' }
            ]
        }

        store.addNodeToActive(newNodePayload)
        return
      } catch (err) { console.error(err) }
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
      } catch (err) { console.error(err) }
    }
  }

  return {
    panelRef, camera, nodes, edges, interaction, selectedNodeId,
    handleWheel, startPan, startDragNode, startConnect, 
    startMoveEdge,
    handleGlobalMouseMove, handleGlobalMouseUp, 
    onCanvasMouseDown, onDrop, store,
    getEdgeData, getPathD, isRelated, GRID_SIZE
  }
}