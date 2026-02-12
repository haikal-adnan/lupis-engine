import { ref } from 'vue'

export function useNodeDragDrop(props, emit) {
  const dragGhostRef = ref(null)
  const isDragOver = ref(false)
  const dragPosition = ref(null)

  const onDragStart = (e) => {
    e.stopPropagation()
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('nodeId', props.node._id || props.node.id)
    e.dataTransfer.setData('nodeType', props.node.type)

    // Simpan Z-Index di dataTransfer untuk validasi cepat (opsional, tapi logic utama di store)
    e.dataTransfer.setData('nodeZIndex', props.node.zIndex ?? 0)

    if (props.node.type === 'layer') {
      e.dataTransfer.setData('application/x-layer', 'true')
    }

    if (dragGhostRef.value) {
      e.dataTransfer.setDragImage(dragGhostRef.value, 0, 0)
    }
  }

  const onDragOver = (e) => {
    const isDraggingLayer = e.dataTransfer.types.includes('application/x-layer')
    const targetType = props.node.type

    if (isDraggingLayer && targetType !== 'layer') return

    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const percentage = y / rect.height

    isDragOver.value = true

    if (isDraggingLayer) {
      dragPosition.value = percentage < 0.5 ? 'top' : 'bottom'
    } else {
      // LOGIC BARU: Area 'inside' diperbesar sedikit untuk memudahkan grouping
      if (targetType === 'layer' || targetType === 'group') {
          // Layer/Group: Top (20%), Inside (60%), Bottom (20%)
          if (percentage < 0.2) dragPosition.value = 'top'
          else if (percentage > 0.8) dragPosition.value = 'bottom'
          else dragPosition.value = 'inside'
      } else {
        // Entity Biasa: Top (30%), Inside (40%), Bottom (30%)
        if (percentage < 0.3) dragPosition.value = 'top'
        else if (percentage > 0.7) dragPosition.value = 'bottom'
        else dragPosition.value = 'inside' 
      }
    }
  }

  const onDragLeave = () => {
    isDragOver.value = false
    dragPosition.value = null
  }

  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const draggedId = e.dataTransfer.getData('nodeId')

    if (draggedId) {
      emit('node-drop', {
        draggedId,
        targetNode: props.node,
        position: dragPosition.value
      })
    }

    isDragOver.value = false
    dragPosition.value = null
  }

  return {
    dragGhostRef,
    isDragOver,
    dragPosition,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop
  }
}