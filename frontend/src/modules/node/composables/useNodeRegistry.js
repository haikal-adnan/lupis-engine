import { defineAsyncComponent } from 'vue';

const REGISTRY = {
  // Keyboard Mapper (Tetap)
  'event_advanced_key': defineAsyncComponent(() => 
    import('@/modules/node/components/inspectors/KeyboardMapperInspector.vue')
  ),

  // BARU: Translate Inspector
  'translate': defineAsyncComponent(() => 
    import('@/modules/node/components/inspectors/TranslateInspector.vue')
  ),
  
  // (Collider dihapus dari sini agar kembali ke Generic Inspector)
};

export function useNodeRegistry() {
  const getInspector = (type) => {
    return REGISTRY[type] || null;
  };

  return {
    getInspector
  };
}