// Canvas viewport interactions, camera pan/zoom, wire connections, and marquee selection.

import { isTypeCompatible } from '../../contract/portTypes.js';
import { ref, shallowReactive, computed, nextTick } from 'vue'
import { useScriptStore } from '@scripts/scripts.js'
import { storeToRefs } from 'pinia'
import { GenerateUUID } from '@utils/utils.js'
import { usePopAlert } from '@composables/composables.js'
import { useScriptHistory } from '@historys/historys.js'
import { useVariableLogic, useNodePreferences } from '@nodes/nodes.js'

const GRID_SIZE = 24
const NODE_WIDTH = 200
const HEADER_HEIGHT = 32
const BODY_PADDING_TOP = 12
const PORT_HEIGHT = 24
const MIN_ZOOM = 0.25
const MAX_ZOOM = 5.0
const ZOOM_SPEED = 0.1
const SNAP_THRESHOLD = 20

let cachedRect = null

export function useGraphEditor() {
  const panelRef = ref(null)
  const store = useScriptStore()
  const { showPop } = usePopAlert()
  const scriptHistory = useScriptHistory()
  
  const { addNodeToCanvas } = useVariableLogic()
  const { addToRecent } = useNodePreferences()

  const { activeScript, selectedNodeId, selectedNodeIds, selectedEdgeId, camera } = storeToRefs(store)

  const nodes = computed(() => activeScript.value?.nodes || [])
  const edges = computed(() => activeScript.value?.edges || [])

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
    dragDelta: { x: 0, y: 0 },
    initialNodePositions: {},
    marqueeStart: { x: 0, y: 0 },
    marqueeEnd: { x: 0, y: 0 },
    candidate: null,
    potentialEdge: null,      
    hasMoved: false          
  })

  const snap = (val) => (val / GRID_SIZE | 0) * GRID_SIZE

  // Calculates viewport center coordinates in graph space
  const getCenterPos = () => {
    if (!panelRef.value) {
      return {
        x: snap((400 - camera.value.x) / camera.value.scale),
        y: snap((300 - camera.value.y) / camera.value.scale)
      }
    }
    const rect = panelRef.value.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    return {
      x: snap((centerX - camera.value.x) / camera.value.scale),
      y: snap((centerY - camera.value.y) / camera.value.scale)
    }
  }

  const NODE_SPAWN_OFFSET_Y = 50

  // Finds an unoccupied canvas position near viewport center
  const getSpawnPos = () => {
    const center = getCenterPos()
    const pos = { x: center.x - NODE_WIDTH / 2, y: center.y - NODE_SPAWN_OFFSET_Y }

    const isOccupied = (p) =>
      nodes.value.some(n => n.position.x === p.x && n.position.y === p.y)

    let guard = 0
    while (isOccupied(pos) && guard++ < 50) {
      pos.x += GRID_SIZE
      pos.y += GRID_SIZE
    }
    return pos
  }

  // Instantiates a blueprint template at target coordinates
  const addNodeFromTemplate = (template, position) => {
    const payload = {
      id: GenerateUUID(),
      type: template.type,
      dynamicMode: template.dynamicMode ?? 'none',
      name: template.label,
      position,
      ...template.defaultData
    }

    store.addNodeToActive(payload)
    scriptHistory.recordAddNode(payload)
    addToRecent(template.type)
    return payload
  }

  const addNodeAtSpawn = (template) => addNodeFromTemplate(template, getSpawnPos())

  // Deletes selected nodes and connected edges from the active script
  const deleteSelectedNodes = () => {
    const targets = selectedNodeIds.value.length > 0 
      ? [...selectedNodeIds.value] 
      : (selectedNodeId.value ? [selectedNodeId.value] : [])

    if (targets.length === 0) return

    const nodesToDelete = nodes.value.filter(n => targets.includes(n.id))
    
    const connectedEdges = edges.value.filter(e => 
      targets.includes(e.source) || targets.includes(e.target)
    )

    scriptHistory.recordRemoveNodes(nodesToDelete, connectedEdges)

    targets.forEach(id => {
      store.removeNodeFromActive(id)
    })

    store.setSelectedNodes([])
    store.setSelectedNode(null)
    store.saveActiveScript()
  }

  const handleKeyDown = (e) => {
    const target = e.target
    const isEditingText = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable

    if (isEditingText) return

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      deleteSelectedNodes()
    }
  }

  // Converts mouse client coordinates to graph world coordinates
  const getClientPos = (e) => {
    if (!cachedRect && panelRef.value) cachedRect = panelRef.value.getBoundingClientRect()
    const r = cachedRect || { left: 0, top: 0 }
    return {
      x: (e.clientX - r.left - camera.value.x) / camera.value.scale,
      y: (e.clientY - r.top - camera.value.y) / camera.value.scale
    }
  }

  const marqueeBox = computed(() => {
    if (interaction.mode !== 'marquee') return null
    const x1 = Math.min(interaction.marqueeStart.x, interaction.marqueeEnd.x)
    const y1 = Math.min(interaction.marqueeStart.y, interaction.marqueeEnd.y)
    const x2 = Math.max(interaction.marqueeStart.x, interaction.marqueeEnd.x)
    const y2 = Math.max(interaction.marqueeStart.y, interaction.marqueeEnd.y)
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
  })

  // Computes rendered node pixel height from port count and visible fields
  const getNodeHeight = (node) => {
    const inputCount = node.inputs?.length || 0
    const outputCount = node.outputs?.length || 0
    const maxPorts = Math.max(inputCount, outputCount)
    const portArea = 12 + (maxPorts * 24)
    const visibleFields = node.settings?.visibleDataFields || []
    const variableArea = visibleFields.length > 0 ? (visibleFields.length * 30) + 10 : 12
    return HEADER_HEIGHT + portArea + variableArea
  }

  // Computes graph space coordinates of a node pin handle
  const getPortPos = (nodeId, portId, type = null) => {
    let node = nodes.value.find(n => n.id === nodeId)
    if (!node) return { x: 0, y: 0 }

    let nodeX = node.position.x
    let nodeY = node.position.y
    
    if (interaction.mode === 'drag' && selectedNodeIds.value.includes(nodeId)) {
      nodeX += interaction.dragDelta.x
      nodeY += interaction.dragDelta.y
    }

    const calculateY = (index) => nodeY + HEADER_HEIGHT + BODY_PADDING_TOP + (index * PORT_HEIGHT) + 8
    const findIdx = (list, pid) => list ? list.findIndex(p => p.id === pid) : -1

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

  // Initiates wire connection drag from a node pin
  const startConnect = (e, nodeId, handleId, type = 'output') => {
    if (e.button !== 0) return
    e.preventDefault()
    if (e.stopPropagation) e.stopPropagation()
    
    cachedRect = panelRef.value?.getBoundingClientRect()
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return

    const portList = type === 'output' ? node.outputs : node.inputs
    const port = portList?.find(p => p.id === handleId)
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

  // Handles click or drag on an existing wire connection
  const startMoveEdge = (e, edge) => {
    if (e.button !== 0) return
    e.preventDefault()
    if (e.stopPropagation) e.stopPropagation()

    store.setSelectedEdge(edge.id)

    interaction.startMouse = { x: e.clientX, y: e.clientY }
    interaction.hasMoved = false
    interaction.potentialEdge = edge
    interaction.mode = 'edge_click_or_drag'
  }

  // Initiates dragging for a node or multi-selected group
  const startDragNode = (e, node) => {
    if (e.button !== 0) return
    e.preventDefault()
    if (e.stopPropagation) e.stopPropagation()

    const isModifier = e.ctrlKey || e.metaKey || e.shiftKey

    if (isModifier) {
      store.toggleNodeSelection(node.id)
    } else {
      if (!selectedNodeIds.value.includes(node.id)) {
        store.setSelectedNode(node.id)
      }
    }

    cachedRect = panelRef.value?.getBoundingClientRect()
    interaction.mode = 'drag'
    interaction.activeId = node.id
    
    const world = getClientPos(e)
    interaction.startMouse = world
    interaction.dragDelta = { x: 0, y: 0 }
    interaction.dragPos = { ...node.position }
    interaction.dragOffset = { x: node.position.x - world.x, y: node.position.y - world.y }

    const initialPositions = {}
    nodes.value.forEach(n => {
      if (selectedNodeIds.value.includes(n.id)) {
        initialPositions[n.id] = { ...n.position }
      }
    })
    interaction.initialNodePositions = initialPositions
  }

  // Handles background mouse down to initiate panning or marquee selection
  const onCanvasMouseDown = (e) => {
    if (e.button === 0) {
      const isCtrlPressed = e.ctrlKey || e.metaKey
      cachedRect = panelRef.value?.getBoundingClientRect()
      
      if (isCtrlPressed) {
        const world = getClientPos(e)
        
        if (!e.shiftKey) {
          store.setSelectedNodes([])
          store.setSelectedEdge(null)
        }

        interaction.mode = 'marquee'
        interaction.marqueeStart = world
        interaction.marqueeEnd = world
      } else {
        store.setSelectedNodes([])
        store.setSelectedEdge(null)

        interaction.mode = 'pan'
        interaction.startMouse = { x: e.clientX, y: e.clientY }
        interaction.startCam = { x: camera.value.x, y: camera.value.y }
      }
    }
  }

  // Global mouse move handler for panning, marquee, wire drawing, and node dragging
  const handleGlobalMouseMove = (e) => {
    if (!interaction.mode) return

    if (interaction.mode === 'marquee') {
      interaction.marqueeEnd = getClientPos(e)
      const box = marqueeBox.value
      if (!box) return

      const inBoxIds = []
      nodes.value.forEach(node => {
        const nw = NODE_WIDTH
        const nh = getNodeHeight(node)
        const nx = node.position.x
        const ny = node.position.y

        const isOverlapping = !(
          box.x + box.w < nx ||
          box.x > nx + nw ||
          box.y + box.h < ny ||
          box.y > ny + nh
        )

        if (isOverlapping) inBoxIds.push(node.id)
      })

      if (e.shiftKey) {
        const combined = Array.from(new Set([...selectedNodeIds.value, ...inBoxIds]))
        store.setSelectedNodes(combined)
      } else {
        store.setSelectedNodes(inBoxIds)
      }
      return
    }

    if (interaction.mode === 'edge_click_or_drag') {
      const dist = Math.hypot(e.clientX - interaction.startMouse.x, e.clientY - interaction.startMouse.y)
      if (dist > 4) {
        interaction.hasMoved = true
        const edge = interaction.potentialEdge
        
        if (edge) {
          const node = nodes.value.find(n => n.id === edge.source)
          const port = node?.outputs?.find(p => p.id === edge.sourceHandle)
          const dataType = port ? (port.dataType || 'any') : 'any'

          scriptHistory.recordRemoveEdge(edge)
          store.removeEdgeFromActive(edge.id)

          cachedRect = panelRef.value?.getBoundingClientRect()
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
      }
      return
    }

    if (interaction.mode === 'pan') {
      store.updateCamera({
        x: interaction.startCam.x + (e.clientX - interaction.startMouse.x),
        y: interaction.startCam.y + (e.clientY - interaction.startMouse.y)
      })
    } else if (interaction.mode === 'drag') {
      const world = getClientPos(e)
      const dx = snap(world.x - interaction.startMouse.x)
      const dy = snap(world.y - interaction.startMouse.y)

      interaction.dragDelta = { x: dx, y: dy }
    } else if (interaction.mode === 'connect') {
      const mousePos = getClientPos(e)
      let nearestDist = SNAP_THRESHOLD
      let foundCandidate = null
      let snapPos = mousePos

      const targetType = interaction.activeType === 'output' ? 'input' : 'output'

      for (const node of nodes.value) {
        if (node.id === interaction.activeId) continue 
        const targetPorts = targetType === 'input' ? (node.inputs || []) : (node.outputs || [])

        for (const port of targetPorts) {
          if (port.enabled === false) continue
          const portPos = getPortPos(node.id, port.id, targetType)
          const dist = Math.hypot(portPos.x - mousePos.x, portPos.y - mousePos.y)

          if (dist < nearestDist) {
            nearestDist = dist
            foundCandidate = { nodeId: node.id, portId: port.id, dataType: port.dataType || 'any' }
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

  // Global mouse up handler committing moves, connections, or panning
  const handleGlobalMouseUp = () => {
    if (interaction.mode === 'edge_click_or_drag') {
      interaction.mode = null
      interaction.potentialEdge = null
      return
    }

    if (interaction.mode === 'drag') {
      const { x: dx, y: dy } = interaction.dragDelta

      if (dx !== 0 || dy !== 0) {
        const movedNodes = []
        selectedNodeIds.value.forEach(id => {
          const initPos = interaction.initialNodePositions[id]
          if (initPos) {
            const newPos = { x: initPos.x + dx, y: initPos.y + dy }
            movedNodes.push({ id, oldPos: { ...initPos }, newPos })

            store.updateNodeInActive(id, { position: newPos })
          }
        })
        store.saveActiveScript()

        scriptHistory.recordMoveNodes(movedNodes)
      }
      interaction.dragDelta = { x: 0, y: 0 }
    }

    if (interaction.mode === 'connect' && interaction.candidate) {
      const sourceType = (interaction.activeDataType || 'any').toLowerCase()
      const targetType = (interaction.candidate.dataType || 'any').toLowerCase()

      const isValid = isTypeCompatible(sourceType, targetType);

      if (!isValid) {
        showPop({
          title: 'Connection Failed',
          message: `Incompatible types: ${sourceType} and ${targetType}`,
          type: 'error',
          duration: 2500
        })
      } else {
        const isOutputDrag = interaction.activeType === 'output'
        const finalSource = isOutputDrag ? interaction.activeId : interaction.candidate.nodeId
        const finalSourceHandle = isOutputDrag ? interaction.activeHandle : interaction.candidate.portId
        const finalTarget = isOutputDrag ? interaction.candidate.nodeId : interaction.activeId
        const finalTargetHandle = isOutputDrag ? interaction.candidate.portId : interaction.activeHandle

        const connectionDataType = isOutputDrag ? targetType : sourceType

        let replacedEdge = null
        if (connectionDataType !== 'execution') {
          const existingEdge = edges.value.find(e => 
            e.target === finalTarget && 
            e.targetHandle === finalTargetHandle
          )

          if (existingEdge) {
            replacedEdge = existingEdge
            store.removeEdgeFromActive(existingEdge.id)
          }
        }

        const newEdgePayload = {
          id: `e_${GenerateUUID()}`,
          source: finalSource,
          sourceHandle: finalSourceHandle,
          target: finalTarget,
          targetHandle: finalTargetHandle
        };

        store.addEdgeToActive(newEdgePayload)
        store.setSelectedEdge(newEdgePayload.id)

        scriptHistory.recordAddEdge(newEdgePayload, replacedEdge)
      }
    }

    interaction.mode = null
    interaction.activeId = null
    interaction.activeHandle = null
    interaction.activeType = null
    interaction.activeDataType = null
    interaction.candidate = null
    interaction.tempParams = null
    interaction.potentialEdge = null
    cachedRect = null 
  }

  // Checks if a node is related to current selection for canvas dimming
  const isRelated = (targetId) => {
    if (interaction.mode === 'connect' || interaction.mode === 'drag') return true

    const selectedCount = selectedNodeIds.value.length

    if (selectedCount >= 2) {
      return selectedNodeIds.value.includes(targetId)
    }

    const subjectId = selectedCount === 1 ? selectedNodeIds.value[0] : selectedNodeId.value
    if (!subjectId) return true
    if (subjectId === targetId) return true

    const connectedEdge = edges.value.find(e => 
      (e.source === subjectId && e.target === targetId) || 
      (e.target === subjectId && e.source === targetId) ||
      (e.id === targetId && (e.source === subjectId || e.target === subjectId))
    )
    return !!connectedEdge
  }

  // Handles mouse wheel events for zoom and axis scrolling
  const handleWheel = (e) => {
    if (e.ctrlKey) e.preventDefault()
    if (!panelRef.value) return
    if (!cachedRect) cachedRect = panelRef.value.getBoundingClientRect()
    const rect = cachedRect
    
    if (e.shiftKey) { 
      store.updateCamera({ y: camera.value.y - (e.deltaY / camera.value.scale) }) 
      return 
    }
    if (e.altKey) { 
      store.updateCamera({ x: camera.value.x - (e.deltaY / camera.value.scale) }) 
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

  // Generates SVG cubic bezier path string between two port coordinates
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
    const center = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    }
    return { path: getPathD(p1, p2), center }
  }

  const getModifierBadgeText = (modifier) => {
    if (!modifier || !modifier.type || modifier.type === 'none') return ''
    const val = modifier.value ?? ''
    switch (modifier.type) {
      case 'add': return `+${val}`
      case 'subtract': return `-${val}`
      case 'multiply': return `x${val}`
      case 'divide': return `÷${val}`
      case 'invert': return `-X`
      case 'abs': return `|X|`
      case 'not': return `!`
      case 'append': return `+ "${val}"`
      case 'prepend': return `"${val}" +`
      case 'uppercase': return `AA`
      case 'lowercase': return `aa`
      case 'trim': return `trim`
      default: return modifier.type.toUpperCase()
    }
  }

  const getModifierBadgeWidth = (modifier) => {
    const text = getModifierBadgeText(modifier)
    if (!text) return 28
    return Math.max(28, text.length * 6.5 + 12)
  }

  // Handles dropping blueprint templates and variables onto the graph canvas
  const onDrop = (event) => {
    const worldPos = getClientPos(event)
    const finalPos = { x: snap(worldPos.x), y: snap(worldPos.y) }
    
    const varJson = event.dataTransfer.getData('application/script-variable')
    if (varJson) {
      try {
        const variable = JSON.parse(varJson)
        const actionType = variable.actionType || 'variableGet'
        addNodeToCanvas(variable, finalPos, actionType, false)
        return
      } catch (err) { 
        console.error("Failed to parse dropped variable payload:", err) 
      }
    }
    
    const templateJson = event.dataTransfer.getData('application/node-template')
    if (templateJson) {
      try {
        addNodeFromTemplate(JSON.parse(templateJson), finalPos)
      } catch (err) { console.error(err) }
    }
  }

  return {
    panelRef,
    camera,
    nodes,
    edges,
    interaction,
    selectedNodeId,
    selectedNodeIds,
    selectedEdgeId,
    marqueeBox,
    getCenterPos,
    handleWheel,
    startPan,
    startDragNode,
    startConnect,
    startMoveEdge,
    getModifierBadgeText,
    getModifierBadgeWidth,
    handleGlobalMouseMove,
    handleGlobalMouseUp,
    onCanvasMouseDown,
    onDrop,
    store,
    getEdgeData,
    getPathD,
    isRelated,
    GRID_SIZE,
    deleteSelectedNodes,
    handleKeyDown,
    getSpawnPos,
    addNodeFromTemplate,
    addNodeAtSpawn,
  }
}
