import { ref, shallowReactive, computed, nextTick } from 'vue'
import { useScriptStore } from '@/stores/useScriptStore'
import { storeToRefs } from 'pinia'
import { GenerateUUID } from '@/commons/utils/generateUUID.js'
import { usePopAlert } from '@/composables/usePopAlert'

const GRID_SIZE = 24
const NODE_WIDTH = 200
const HEADER_HEIGHT = 32
const BODY_PADDING_TOP = 12
const PORT_HEIGHT = 24
const MIN_ZOOM = 0.25
const MAX_ZOOM = 5.0
const ZOOM_SPEED = 0.1
const SNAP_THRESHOLD = 50

let cachedRect = null
const interaction = shallowReactive({
  mode: null,
  activeId: null,
  activeHandle: null,
  activeType: null, 
  activeDataType: null, 
  hoveredId: null,
  startMouse: { x: 0, y: 0 },
  startCam: { x: 0, y: 0 },
  dragOffset: { x: 0, y: 0 },
  tempParams: null,
  dragPos: { x: 0, y: 0 },
  candidate: null
})

export function useGraphEditor() {
  const panelRef = ref(null)
  const store = useScriptStore()
  const { showPop } = usePopAlert()
  
  const { activeScript, selectedNodeId, camera } = storeToRefs(store)

  const nodes = computed(() => activeScript.value?.nodes || [])
  const edges = computed(() => activeScript.value?.edges || [])

  const getClientPos = (e) => {
    if (!cachedRect && panelRef.value) cachedRect = panelRef.value.getBoundingClientRect()
    const r = cachedRect || { left: 0, top: 0 }
    return {
      x: (e.clientX - r.left - camera.value.x) / camera.value.scale,
      y: (e.clientY - r.top - camera.value.y) / camera.value.scale
    }
  }

  const getCenterPos = () => {
    if (!cachedRect && panelRef.value) {
      cachedRect = panelRef.value.getBoundingClientRect()
    }
    
    const width = cachedRect ? cachedRect.width : window.innerWidth
    const height = cachedRect ? cachedRect.height : window.innerHeight

    const screenCenterX = width / 2
    const screenCenterY = height / 2

    return {
      x: snap((screenCenterX - camera.value.x) / camera.value.scale),
      y: snap((screenCenterY - camera.value.y) / camera.value.scale)
    }
  }

  const snap = (val) => (val / GRID_SIZE | 0) * GRID_SIZE

  const getPortPos = (nodeId, portId, type = null) => {
    let node = nodes.value.find(n => n._id === nodeId)
    if (!node) return { x: 0, y: 0 }

    let nodeX = node.position.x
    let nodeY = node.position.y
    
    if (interaction.mode === 'drag' && interaction.activeId === nodeId) {
       nodeX = interaction.dragPos.x
       nodeY = interaction.dragPos.y
    }

    const calculateY = (index) => nodeY + HEADER_HEIGHT + BODY_PADDING_TOP + (index * PORT_HEIGHT) + 8
    const findIdx = (list, pid) => list ? list.findIndex(p => p._id === pid) : -1

    if (type === 'output') {
      const index = findIdx(node.outputs, portId)
      if (index !== -1) return { x: nodeX + NODE_WIDTH, y: calculateY(index) }
    }

    if (type === 'input') {
      const index = findIdx(node.inputs, portId)
      if (index !== -1) return { x: nodeX, y: calculateY(index) }
    }

    if (!type) {
        let index = findIdx(node.outputs, portId)
        if (index !== -1) return { x: nodeX + NODE_WIDTH, y: calculateY(index) }
        index = findIdx(node.inputs, portId)
        if (index !== -1) return { x: nodeX, y: calculateY(index) }
    }
    
    return { x: nodeX + (NODE_WIDTH / 2), y: nodeY + HEADER_HEIGHT }
  }

  const startConnect = (e, nodeId, handleId, type = 'output') => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    
    cachedRect = panelRef.value.getBoundingClientRect()
    const node = nodes.value.find(n => n._id === nodeId)
    if (!node) return

    const portList = type === 'output' ? node.outputs : node.inputs
    const port = portList?.find(p => p._id === handleId)
    const dataType = port ? (port.dataType || 'any') : 'any' 

    interaction.mode = 'connect'
    interaction.activeId = nodeId
    interaction.activeHandle = handleId
    interaction.activeType = type 
    interaction.activeDataType = dataType 
    interaction.candidate = null 
    
    interaction.tempParams = {
      p1: getPortPos(nodeId, handleId, type),
      p2: getClientPos(e)
    }
  }

  const startMoveEdge = (e, edge) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    const node = nodes.value.find(n => n._id === edge.source)
    const port = node?.outputs?.find(p => p._id === edge.sourceHandle)
    const dataType = port ? (port.dataType || 'any') : 'any'

    store.removeEdgeFromActive(edge._id)

    cachedRect = panelRef.value.getBoundingClientRect()
    interaction.mode = 'connect'
    interaction.activeId = edge.source
    interaction.activeHandle = edge.sourceHandle
    interaction.activeType = 'output'
    interaction.activeDataType = dataType
    interaction.candidate = null

    interaction.tempParams = {
        p1: getPortPos(edge.source, edge.sourceHandle, 'output'),
        p2: getClientPos(e)
    }
  }

  const handleGlobalMouseMove = (e) => {
    if (!interaction.mode) return
    e.preventDefault()

    if (interaction.mode === 'pan') {
      store.updateCamera({
        x: interaction.startCam.x + (e.clientX - interaction.startMouse.x),
        y: interaction.startCam.y + (e.clientY - interaction.startMouse.y)
      })
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

      const targetType = interaction.activeType === 'output' ? 'input' : 'output'

      for (const node of nodes.value) {
        if (node._id === interaction.activeId) continue 
        const targetPorts = targetType === 'input' ? (node.inputs || []) : (node.outputs || [])

        for (const port of targetPorts) {
           if (port.enabled === false) continue
           const portPos = getPortPos(node._id, port._id, targetType)
           const dist = Math.hypot(portPos.x - mousePos.x, portPos.y - mousePos.y)

           if (dist < nearestDist) {
             nearestDist = dist
             foundCandidate = { nodeId: node._id, portId: port._id, dataType: port.dataType || 'any' }
             snapPos = portPos
           }
        }
      }

      interaction.candidate = foundCandidate
      if (interaction.tempParams) {
          interaction.tempParams = { ...interaction.tempParams, p2: snapPos }
      }
    }
  }

  const handleGlobalMouseUp = () => {
    if (interaction.mode === 'drag' && interaction.activeId) {
        store.updateNodeInActive(interaction.activeId, { position: interaction.dragPos })
    }

    if (interaction.mode === 'connect' && interaction.candidate) {
        const sourceType = interaction.activeDataType || 'any';
        const targetType = interaction.candidate.dataType || 'any';

        let isValid = false;
        if (sourceType === 'execution' || targetType === 'execution') {
            isValid = (sourceType === 'execution' && targetType === 'execution');
        } else if (sourceType === 'any' || targetType === 'any') {
            isValid = true;
        } else {
            isValid = (sourceType === targetType);
        }

        if (!isValid) {
            showPop({
                title: 'Connection Failed',
                message: `Incompatible types: ${sourceType} and ${targetType}`,
                type: 'error',
                duration: 2500
            });
        } else {
             const isOutputDrag = interaction.activeType === 'output'
             const finalSource = isOutputDrag ? interaction.activeId : interaction.candidate.nodeId
             const finalSourceHandle = isOutputDrag ? interaction.activeHandle : interaction.candidate.portId
             const finalTarget = isOutputDrag ? interaction.candidate.nodeId : interaction.activeId
             const finalTargetHandle = isOutputDrag ? interaction.candidate.portId : interaction.activeHandle

             const connectionDataType = isOutputDrag ? targetType : sourceType;

             if (connectionDataType !== 'execution') {
                 const existingEdge = edges.value.find(e => 
                    e.target === finalTarget && 
                    e.targetHandle === finalTargetHandle
                 );

                 if (existingEdge) {
                    const oldSourceNode = nodes.value.find(n => n._id === existingEdge.source);
                    const oldNodeName = oldSourceNode?.settings?.headerTitle || 'Previous Node';
                    store.removeEdgeFromActive(existingEdge._id);
                    showPop({
                        title: 'Connection Updated',
                        message: `Replaced connection from ${oldNodeName}`,
                        type: 'success',
                        duration: 2000
                    });
                 }
             }

             store.addEdgeToActive({
                 _id: `e_${Date.now()}`,
                 source: finalSource,
                 sourceHandle: finalSourceHandle,
                 target: finalTarget,
                 targetHandle: finalTargetHandle
             });
        }
    }

    interaction.mode = null
    interaction.activeId = null
    interaction.activeHandle = null
    interaction.activeType = null
    interaction.activeDataType = null
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
    interaction.dragOffset = { x: node.position.x - world.x, y: node.position.y - world.y }
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
    
    if (e.shiftKey) { 
      store.updateCamera({ y: camera.value.y - (e.deltaY / camera.value.scale) }); 
      return 
    }
    if (e.altKey) { 
      store.updateCamera({ x: camera.value.x - (e.deltaY / camera.value.scale) }); 
      return 
    }
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const delta = e.deltaY < 0 ? 1 : -1
    const oldScale = camera.value.scale
    let newScale = oldScale * (1 + (delta * ZOOM_SPEED))
    newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale))
    
    if (newScale === oldScale) return
    
    const worldX = (mouseX - camera.value.x) / oldScale
    const worldY = (mouseY - camera.value.y) / oldScale
    
    store.updateCamera({
      scale: newScale,
      x: mouseX - (worldX * newScale),
      y: mouseY - (worldY * newScale)
    })
    
    nextTick(() => { cachedRect = panelRef.value?.getBoundingClientRect() })
  }

  const startPan = (e) => {
    interaction.mode = 'pan'
    interaction.startMouse = { x: e.clientX, y: e.clientY }
    interaction.startCam = { x: camera.value.x, y: camera.value.y }
  }

  const getPathD = (p1, p2) => {
    const dist = Math.abs(p1.x - p2.x)
    const controlDist = Math.min(dist * 0.5, 150)
    const isBackwards = p2.x < p1.x
    const finalControl = isBackwards ? Math.max(controlDist, 120) : controlDist
    return `M ${p1.x} ${p1.y} C ${p1.x + finalControl} ${p1.y}, ${p2.x - finalControl} ${p2.y}, ${p2.x} ${p2.y}`
  }

  const getEdgeData = (edge) => {
    const p1 = getPortPos(edge.source, edge.sourceHandle, 'output')
    const p2 = getPortPos(edge.target, edge.targetHandle, 'input')
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
        const varType = variable.type.toLowerCase()
        const varColor = '#777777'

        const newNodePayload = {
            _id: GenerateUUID(),
            type: isSetter ? 'variable_set' : 'variable_get',
            label: isSetter ? `Set ${variable.name}` : `Get ${variable.name}`,
            allowDynamicInputs: false,
            allowDynamicOutputs: false,
            position: finalPos,
            data: { variableId: variable._id, scope: variable.scope },
            settings: { 
                headerTitle: isSetter ? `Set ${variable.name}` : `Get ${variable.name}`,
                headerColor: varColor,
                category: 'Variable'
            }
        }
        if (isSetter) {
            newNodePayload.inputs = [
                { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#fff' },
                { _id: 'val_in', label: 'Value', dataType: varType, color: varColor }
            ]
            newNodePayload.outputs = [
                { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#fff' },
                { _id: 'val_out', label: 'Value', dataType: varType, color: varColor }
            ]
        } else {
            newNodePayload.inputs = []
            newNodePayload.outputs = [
                { _id: 'val_out', label: 'Value', dataType: varType, color: varColor }
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
          allowDynamicInputs: template.allowDynamicInputs ?? false,
          allowDynamicOutputs: template.allowDynamicOutputs ?? false,
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
    startMoveEdge, getCenterPos,
    handleGlobalMouseMove, handleGlobalMouseUp, 
    onCanvasMouseDown, onDrop, store,
    getEdgeData, getPathD, isRelated, GRID_SIZE
  }
}