import { Clapperboard } from 'lucide-vue-next';

/**
 * ============================================================================
 * BLUEPRINT: SCENE MANAGEMENT
 * ============================================================================
 */
export const BlueprintScene = {
  id: 'game_scene',
  label: 'Scene Management',
  color: '#9C27B0', 
  icon: Clapperboard,
  items: [
    {
      type: 'event_scene_start',
      label: 'On Scene Start',
      description: 'Triggered exactly once when the scene has successfully loaded and started.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Scene Start',
          headerColor: '#059669',
          category: 'Scene'
        },
        inputs: [],
        outputs: [
          { id: 'out', label: 'Start', dataType: 'execution', color: '#FFFFFF' },
          { id: 'scene_name', label: 'Scene Name', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          code: 
`context.onSceneStart((sceneName) => {
  node._tempData = node._tempData || {};
  node._tempData['scene_name'] = sceneName;
  outputs['Scene Name'] = sceneName;
  outputs['scene_name'] = sceneName;
  outputs['Start'] = true;
  outputs['out'] = true;
  context.triggerFlow('out');
});
return;`
        }
      }
    },
    { 
      type: 'change_scene', 
      label: 'Change Scene', 
      description: 'Switches to another scene using the specified Scene Name.', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Change Scene', 
          headerColor: '#8E24AA', 
          category: 'Scene' 
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'sceneName', label: 'Scene Name', dataType: 'string', color: '#F48FB1' } 
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            sceneName: ''
          },
          code: 
`const sceneName = inputs['Scene Name'] ?? inputs['sceneName'];

outputs['Out'] = true;
outputs['exec_out'] = true;

if (sceneName) {
  context.scene.load(sceneName);
} else {
  console.warn('[Change Scene] Gagal pindah scene: Input Scene Name kosong.');
}
return;`
        }
      } 
    },
    { 
      type: 'restart_scene', 
      label: 'Restart Scene', 
      description: 'Reloads the currently active scene.', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Restart Scene', 
          headerColor: '#8E24AA', 
          category: 'Scene' 
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`outputs['Out'] = true;
outputs['exec_out'] = true;
context.scene.restart();
return;`
        }
      } 
    },
    { 
      type: 'get_current_scene', 
      label: 'Get Current Scene', 
      description: 'Retrieves the name of the currently active scene.', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Get Current Scene', 
          headerColor: '#8E24AA', 
          category: 'Scene' 
        },
        inputs: [], 
        outputs: [
          { id: 'sceneName', label: 'Scene Name', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          code: 
`const currentScene = context.scene.getCurrentName();
outputs['Scene Name'] = currentScene;
outputs['sceneName'] = currentScene;
return;`
        }
      } 
    }
  ]
};