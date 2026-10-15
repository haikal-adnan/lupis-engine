import { Clapperboard } from 'lucide-vue-next';

export const BlueprintScene = {
  id: 'game_scene',
  label: 'Scene Management',
  color: '#9C27B0', 
  icon: Clapperboard,
  items: [
    {
      type: 'eventSceneStart',
      label: 'On Scene Start',
      description: 'Triggered exactly once when the scene has successfully loaded and started.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Scene Start',
          headerColor: '#059669',
          category: 'Scene Management'
        },
        inputs: [],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'sceneName', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          code: 
`context.onSceneStart((sceneName) => {
  outputs.sceneName = sceneName;
  outputs.execOut = true;
  context.triggerFlow('execOut');
});
return;`
        }
      }
    },
    { 
      type: 'changeScene', 
      label: 'Change Scene', 
      description: 'Switches to another scene using the specified Scene Name.', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Change Scene', 
          headerColor: '#8E24AA', 
          category: 'Scene Management' 
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'sceneName', dataType: 'string', color: '#F48FB1' } 
        ], 
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            sceneName: ''
          },
          code: 
`const sceneName = inputs.sceneName;

outputs.execOut = true;

context.scene.load(sceneName);
return;`
        }
      } 
    },
    { 
      type: 'restartScene', 
      label: 'Restart Scene', 
      description: 'Reloads the currently active scene.', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Restart Scene', 
          headerColor: '#8E24AA', 
          category: 'Scene Management' 
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' }
        ], 
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`outputs.execOut = true;
context.scene.restart();
return;`
        }
      } 
    },
    { 
      type: 'getCurrentScene', 
      label: 'Get Current Scene', 
      description: 'Retrieves the name of the currently active scene.', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Get Current Scene', 
          headerColor: '#8E24AA', 
          category: 'Scene Management' 
        },
        inputs: [], 
        outputs: [
          { id: 'sceneName', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          code: 
`const currentScene = context.scene.getCurrentName();
outputs.sceneName = currentScene;
return;`
        }
      } 
    }
  ]
};