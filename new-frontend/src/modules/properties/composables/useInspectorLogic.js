import { ref, reactive, computed } from 'vue';

// State Global Mock
const selectedEntity = reactive({
  id: 'ent-1',
  name: 'Player Sprite',
  components: {
    SpriteRenderer: {
      assetId: 'asset-001',
      source: { x: 0, y: 0, w: 32, h: 32 }
    },
    ShapeRenderer: {
      type: 'rectangle',
      color: '#3b82f6'
    },
    TextRenderer: {
      value: "Hello World",
      fontSize: 16,
      color: "#ffffff",
      align: "center"
    }
  }
});

export function useInspectorLogic() {
  
  // Mock Bind Prop (Nested Object)
  function bindNestedProp(compName, parentProp, childProp) {
    return computed({
      get: () => selectedEntity.components[compName][parentProp][childProp],
      set: (val) => {
        selectedEntity.components[compName][parentProp][childProp] = val;
        console.log(`Updated ${compName}.${parentProp}.${childProp} to`, val);
      }
    });
  }

  // Mock Bind Prop (Direct)
  function bindComponentProp(compName, propName) {
    return computed({
      get: () => selectedEntity.components[compName][propName],
      set: (val) => {
        selectedEntity.components[compName][propName] = val;
      }
    });
  }

  function removeComponent(compName) {
    console.log('Mock Remove:', compName);
    delete selectedEntity.components[compName];
  }

  return {
    selectedEntity: computed(() => selectedEntity),
    bindNestedProp,
    bindComponentProp,
    removeComponent
  };
}