import { ref } from "vue";

const isLeftCollapsed = ref(false);
const isRightCollapsed = ref(false);

export function useEditorLayout() {
  
  const toggleLeft = () => isLeftCollapsed.value = !isLeftCollapsed.value;
  const toggleRight = () => isRightCollapsed.value = !isRightCollapsed.value;

  const setLeftCollapsed = (val) => isLeftCollapsed.value = val;
  const setRightCollapsed = (val) => isRightCollapsed.value = val;

  return {
    isLeftCollapsed,
    isRightCollapsed,
    toggleLeft,
    toggleRight,
    setLeftCollapsed,
    setRightCollapsed
  };
}