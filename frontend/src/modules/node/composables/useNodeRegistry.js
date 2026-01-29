import { defineAsyncComponent } from 'vue';

/**
 * REGISTRY MAP
 * Key: node.type (harus persis sama dengan yang di template)
 * Value: Async Component Import
 */
const REGISTRY = {
  // Mapping untuk Advanced Keyboard Mapper yang baru kita bahas
  'event_advanced_key': defineAsyncComponent(() => 
    import('@/modules/node/components/inspectors/KeyboardMapperInspector.vue')
  ),

  // Contoh masa depan:
  // 'dialogue_system': defineAsyncComponent(() => import('@/modules/dialogue/components/DialogueInspector.vue')),
  // 'particle_emitter': defineAsyncComponent(() => import('@/modules/vfx/components/ParticleInspector.vue')),
};

export function useNodeRegistry() {
  
  /**
   * Mengambil komponen Inspector khusus berdasarkan tipe node.
   * Mengembalikan null jika node tersebut menggunakan Generic Inspector.
   * * @param {String} type - Tipe node (misal: 'event_advanced_key')
   * @returns {Component|null}
   */
  const getInspector = (type) => {
    return REGISTRY[type] || null;
  };

  return {
    getInspector
  };
}