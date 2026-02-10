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
  
  'variable_get': defineAsyncComponent(() => 
    import('@/modules/node/components/inspectors/VariableInspector.vue')
  ),
  
  'variable_set': defineAsyncComponent(() => 
    import('@/modules/node/components/inspectors/VariableInspector.vue')
  ),

  'math_chain': defineAsyncComponent(() => 
    import('@/modules/node/components/inspectors/MathChainInspector.vue')
  ),

  'logic_compare': defineAsyncComponent(() => 
    import('@/modules/node/components/inspectors/ComparisonChainInspector.vue')
  ),
};

export function useNodeRegistry() {
  const getInspector = (type) => {
    return REGISTRY[type] || null;
  };

  return {
    getInspector
  };
}