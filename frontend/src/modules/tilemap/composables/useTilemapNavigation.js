import { ref, computed } from 'vue';

export function useTilemapNavigation() {
  // --- CONFIG ---
  // Sesuaikan nilai ini agar pas dengan rasa mouse Anda (0.5 - 1.2 biasanya pas)
  const WHEEL_SENSITIVITY = 0.8; 

  // --- STATE ---
  const viewX = ref(0);
  const viewY = ref(0);
  const viewScale = ref(1);
  const viewportRef = ref(null);

  // Pointer State
  const isPanning = ref(false);
  const lastPtrX = ref(0);
  const lastPtrY = ref(0);

  // --- ACTIONS ---

  const resetView = () => {
    viewScale.value = 1;
    viewX.value = 20;
    viewY.value = 20;
  };

  const handleWheel = (e) => {
    if (!viewportRef.value) return;

    // Hitung kecepatan pan yang dinamis berdasarkan Zoom Level
    // Semakin besar zoom, semakin pelan gerakannya (agar presisi)
    // Semakin kecil zoom, semakin cepat gerakannya
    const dynamicSpeed = (e.deltaY * WHEEL_SENSITIVITY) / viewScale.value;

    // 1. Horizontal Pan (Shift)
    if (e.shiftKey) {
      viewX.value -= dynamicSpeed; 
      return;
    }

    // 2. Vertical Pan (Alt)
    if (e.altKey) {
      viewY.value -= dynamicSpeed;
      return;
    }

    // 3. Zoom Logic (Default)
    const rect = viewportRef.value.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const delta = e.deltaY > 0 ? -1 : 1;
    let newScale = viewScale.value * (delta < 0 ? 0.9 : 1.1);
    
    newScale = Math.max(0.25, Math.min(10, newScale));

    const worldX = (mouseX - viewX.value) / viewScale.value;
    const worldY = (mouseY - viewY.value) / viewScale.value;

    viewScale.value = newScale;
    viewX.value = mouseX - (worldX * newScale);
    viewY.value = mouseY - (worldY * newScale);
  };

  const getGridPos = (clientX, clientY, tileWidth, tileHeight) => {
    if (!viewportRef.value) return { x: 0, y: 0 };
    
    const rect = viewportRef.value.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    const worldX = (mouseX - viewX.value) / viewScale.value;
    const worldY = (mouseY - viewY.value) / viewScale.value;
    
    const tw = tileWidth || 32;
    const th = tileHeight || 32;
    
    return { 
      x: Math.floor(worldX / tw), 
      y: Math.floor(worldY / th) 
    };
  };

  const startPan = (clientX, clientY) => {
    isPanning.value = true;
    lastPtrX.value = clientX;
    lastPtrY.value = clientY;
  };

  const updatePan = (clientX, clientY) => {
    if (!isPanning.value) return;
    
    // Note: Untuk Drag Pan biasanya 1:1 dengan gerakan mouse terasa paling natural ("Paper Drag").
    // Tapi jika ingin sensitivitas zoom juga diterapkan di sini, gunakan rumus di bawah:
    // viewX.value += (clientX - lastPtrX.value) / viewScale.value; 
    
    // Saya sarankan tetap 1:1 untuk drag mouse:
    viewX.value += clientX - lastPtrX.value;
    viewY.value += clientY - lastPtrY.value;
    
    lastPtrX.value = clientX;
    lastPtrY.value = clientY;
  };

  const endPan = () => {
    isPanning.value = false;
  };

  const containerStyle = computed(() => ({
    transform: `translate(${Math.floor(viewX.value)}px, ${Math.floor(viewY.value)}px) scale(${viewScale.value})`
  }));

  return {
    viewX,
    viewY,
    viewScale,
    viewportRef,
    isPanning,
    containerStyle,
    resetView,
    handleWheel,
    getGridPos,
    startPan,
    updatePan,
    endPan
  };
}