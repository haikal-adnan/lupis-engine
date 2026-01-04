import { ref } from 'vue'

export function useLayoutState() {
  const layoutRef = ref(null)
  
  // Sidebar States
  const isLeftSidebarCollapsed = ref(false)
  const isRightSidebarCollapsed = ref(false)
  
  // Bottom Panel States
  const activeBottomTab = ref(null)
  const lastActiveBottomTab = ref('assets') // default tab

  // Actions
  const toggleLeftSidebar = () => {
    isLeftSidebarCollapsed.value = !isLeftSidebarCollapsed.value
  }

  const toggleRightSidebar = () => {
    isRightSidebarCollapsed.value = !isRightSidebarCollapsed.value
  }

  const toggleBottomTab = (tabId) => {
    if (activeBottomTab.value === tabId) {
      // Close
      activeBottomTab.value = null
      layoutRef.value?.setBottomPanel(false)
    } else {
      // Open
      activeBottomTab.value = tabId
      lastActiveBottomTab.value = tabId
      layoutRef.value?.setBottomPanel(true)
    }
  }

  const handleDragOpen = () => {
    // Jika panel ditarik manual dari bawah, aktifkan tab terakhir
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