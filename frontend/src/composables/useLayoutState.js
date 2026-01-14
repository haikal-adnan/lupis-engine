import { ref } from 'vue'

export function useLayoutState() {
  const layoutRef = ref(null)
  
  const isLeftSidebarCollapsed = ref(false)
  const isRightSidebarCollapsed = ref(false)
  
  const activeBottomTab = ref(null)
  const lastActiveBottomTab = ref('assets')

  const toggleLeftSidebar = () => {
    isLeftSidebarCollapsed.value = !isLeftSidebarCollapsed.value
  }

  const toggleRightSidebar = () => {
    isRightSidebarCollapsed.value = !isRightSidebarCollapsed.value
  }

  const toggleBottomTab = (tabId) => {
    if (activeBottomTab.value === tabId) {
      activeBottomTab.value = null
      layoutRef.value?.setBottomPanel(false)
    } else {
      activeBottomTab.value = tabId
      lastActiveBottomTab.value = tabId
      layoutRef.value?.setBottomPanel(true)
    }
  }

  const handleDragOpen = () => {
    if (!activeBottomTab.value) {
      activeBottomTab.value = lastActiveBottomTab.value || 'assets'
    }
  }

  const closeBottomPanel = () => {
    activeBottomTab.value = null
  }

  return {
    layoutRef,
    isLeftSidebarCollapsed,
    isRightSidebarCollapsed,
    activeBottomTab,
    toggleLeftSidebar,
    toggleRightSidebar,
    toggleBottomTab,
    handleDragOpen,
    closeBottomPanel
  }
}