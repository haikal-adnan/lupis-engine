import { defineAsyncComponent } from 'vue';

const REGISTRY = {
  'event_advanced_key': defineAsyncComponent(() => 
    import('@editors/node/components/inspectors/KeyboardMapperInspector.vue')
  ),
  
  'variable_get': defineAsyncComponent(() => 
    import('@editors/node/components/inspectors/VariableInspector.vue')
  ),
  
  'variable_set': defineAsyncComponent(() => 
    import('@editors/node/components/inspectors/VariableInspector.vue')
  ),

  'math_chain': defineAsyncComponent(() => 
    import('@editors/node/components/inspectors/MathChainInspector.vue')
  ),

  'logic_branch': defineAsyncComponent(() => 
    import('@editors/node/components/inspectors/BranchInspector.vue')
  ),

  'logic_switch': defineAsyncComponent(() => 
    import('@editors/node/components/inspectors/SwitchInspector.vue')
  ),

  'logic_compare': defineAsyncComponent(() => 
    import('@editors/node/components/inspectors/ComparisonChainInspector.vue')
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