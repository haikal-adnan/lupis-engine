import { 
  Clapperboard, 
  RefreshCw, 
  MapPin 
} from 'lucide-vue-next';

export const BlueprintScene = {
  id: 'game_scene',
  label: 'Scene Management',
  color: '#9C27B0', 
  icon: Clapperboard,
  items: [
    { 
      type: 'change_scene', 
      label: 'Change Scene', 
      description: 'Switches to another scene using the specified Scene Name.', 
      icon: Clapperboard,
      allowDynamicInputs: false, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Change Scene', headerColor: '#8E24AA', category: 'Scene' },
        data: {
          code: `const sceneName = inputs['Scene Name'];
outputs['Out'] = true;

if (sceneName) {
  context.loadScene(sceneName);
} else {
  console.warn("[Change Scene] Gagal pindah scene: Input Scene Name kosong.");
}
return;`
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'sceneName', label: 'Scene Name', dataType: 'string', color: '#E040FB' } 
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    },
    { 
      type: 'restart_scene', 
      label: 'Restart Scene', 
      description: 'Reloads the currently active scene.', 
      icon: RefreshCw,
      allowDynamicInputs: false, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Restart Scene', headerColor: '#8E24AA', category: 'Scene' },
        data: {
          code: `outputs['Out'] = true;
context.game.sceneSystem.restartScene();
return;`
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    },
    { 
      type: 'get_current_scene', 
      label: 'Get Current Scene', 
      description: 'Retrieves the name of the currently active scene.', 
      icon: MapPin, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: false, 
      defaultData: { 
        settings: { headerTitle: 'Get Current Scene', headerColor: '#8E24AA', category: 'Scene' },
        data: {
          code: `const currentScene = context.game.world?.currentSceneName || "";
outputs['Scene Name'] = currentScene;
outputs['sceneName'] = currentScene;
return;`
        },
        inputs: [], 
        outputs: [
          { id: 'sceneName', label: 'Scene Name', dataType: 'string', color: '#E040FB' }
        ]
      } 
    }
  ]
};