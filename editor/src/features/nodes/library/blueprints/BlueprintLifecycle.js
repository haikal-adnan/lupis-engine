import { PlayCircle } from 'lucide-vue-next';

export const BlueprintLifecycle = {
  id: 'game_lifecycle',
  label: 'Scene & Lifecycle',
  color: '#9C27B0',
  icon: PlayCircle,
  items: [
{
      type: 'eventTick',
      label: 'On Tick',
      description: 'Fires every engine frame with delta time in seconds for continuous updates.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Tick',
          headerColor: '#3B82F6',
          category: 'Scene & Lifecycle'
        },
        inputs: [],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'deltaTime', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          code: 
`context.onTick((dt) => {
  outputs.deltaTime = dt;
  outputs.execOut = true;
  context.triggerFlow('execOut');
});
return;`
        }
      }
    },
{
      type: 'eventGameStart',
      label: 'On Game Start',
      description: 'Fires once when the game runtime initializes and starts.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Game Start',
          headerColor: '#10B981',
          category: 'Scene & Lifecycle'
        },
        inputs: [],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`context.onGameStart(() => {
  outputs.execOut = true;
  context.triggerFlow('execOut');
});
return;`
        }
      }
    },
{
      type: 'eventGamePause',
      label: 'On Game Pause',
      description: 'Fires when the game is paused.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Game Pause',
          headerColor: '#EF4444',
          category: 'Scene & Lifecycle'
        },
        inputs: [],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`context.onGamePause(() => {
  outputs.execOut = true;
  context.triggerFlow('execOut');
});
return;`
        }
      }
    },
{
      type: 'eventGameResume',
      label: 'On Game Resume',
      description: 'Fires when the game resumes from a paused state.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Game Resume',
          headerColor: '#10B981',
          category: 'Scene & Lifecycle'
        },
        inputs: [],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`context.onGameResume(() => {
  outputs.execOut = true;
  context.triggerFlow('execOut');
});
return;`
        }
      }
    },
{
      type: 'eventGameRestart',
      label: 'On Game Restart',
      description: 'Fires when the entire game runtime is restarted.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Game Restart',
          headerColor: '#F59E0B',
          category: 'Scene & Lifecycle'
        },
        inputs: [],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`context.onGameRestart(() => {
  outputs.execOut = true;
  context.triggerFlow('execOut');
});
return;`
        }
      }
    },
{
      type: 'eventGameQuit',
      label: 'On Game Quit',
      description: 'Fires when the game receives a quit or close command.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Game Quit',
          headerColor: '#EF4444',
          category: 'Scene & Lifecycle'
        },
        inputs: [],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`context.onGameQuit(() => {
  outputs.execOut = true;
  context.triggerFlow('execOut');
});
return;`
        }
      }
    },
    {
      type: 'actionSetGameState',
      label: 'Set Game State',
      description: 'Controls the engine game state (pause, resume, restart, or quit).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set Game State',
          headerColor: '#9C27B0',
          category: 'Scene & Lifecycle'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'action', dataType: 'string', color: '#F48FB1', defaultValue: 'pause' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            action: 'pause'
          },
          options: {
            action: [
              { label: 'Pause', value: 'pause' },
              { label: 'Resume', value: 'resume' },
              { label: 'Restart', value: 'restart' },
              { label: 'Quit', value: 'quit' }
            ]
          },
          code: 
`const act = inputs.action;
if (act === 'pause') {
  context.lifecycle.pause();
} else if (act === 'resume') {
  context.lifecycle.resume();
} else if (act === 'restart') {
  context.lifecycle.restart();
} else if (act === 'quit') {
  context.lifecycle.quit();
}
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'changeScreen',
      label: 'Change Screen',
      description: 'Toggles display mode between windowed and fullscreen with custom dimensions.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Change Screen',
          headerColor: '#9C27B0',
          category: 'Scene & Lifecycle'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'mode', dataType: 'string', color: '#F48FB1', defaultValue: 'window' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            mode: 'window'
          },
          options: {
            mode: [
              { label: 'Window', value: 'window' },
              { label: 'Full Screen', value: 'fullscreen' }
            ]
          },
          code: 
`const targetMode = String(inputs.mode);
if (targetMode === 'fullscreen' || targetMode === 'Full Screen') {
  context.lifecycle.changeScreen('fullscreen');
} else {
  context.lifecycle.changeScreen('window');
}
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'eventSceneStart',
      label: 'On Scene Start',
      description: 'Fires once when the active scene finishes loading and begins execution.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Scene Start',
          headerColor: '#059669',
          category: 'Scene & Lifecycle'
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
      description: 'Transitions to a target scene by name with an optional screen fade effect.', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Change Scene', 
          headerColor: '#8E24AA', 
          category: 'Scene & Lifecycle' 
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
      description: 'Reloads the current active scene, resetting its entities and state.', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Restart Scene', 
          headerColor: '#8E24AA', 
          category: 'Scene & Lifecycle' 
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
          category: 'Scene & Lifecycle' 
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
    },
    { 
      type: 'injectLayer', 
      label: 'Inject Layer', 
      description: 'Injects a reusable layer and its entities from another scene template into the target scene.', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Inject Layer', 
          headerColor: '#8E24AA', 
          category: 'Scene & Lifecycle' 
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'sceneTemplate', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'layerTemplate', dataType: 'string', color: '#F48FB1', defaultValue: null },
          { id: 'targetScene', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'targetLayer', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'inheritState', dataType: 'boolean', color: '#4CAF50', defaultValue: true }
        ], 
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'success', dataType: 'boolean', color: '#4CAF50' },
          { id: 'isFirstLoad', dataType: 'boolean', color: '#4CAF50' }
        ],
        data: {
          values: {
            sceneTemplate: '',
            layerTemplate: null,
            targetScene: 'self',
            targetLayer: 'self',
            inheritState: true
          },
          code: 
`const sceneTemplate = inputs.sceneTemplate ? String(inputs.sceneTemplate) : '';
const layerTemplate = inputs.layerTemplate ? String(inputs.layerTemplate) : null;
const targetScene = inputs.targetScene ? String(inputs.targetScene) : 'self';
const targetLayer = inputs.targetLayer ? String(inputs.targetLayer) : 'self';
const inheritState = inputs.inheritState !== false && inputs.inheritState !== 'false';

const res = context.scene.injectLayer(sceneTemplate, layerTemplate, inheritState, targetLayer, targetScene);
outputs.success = Boolean(res && res.success);
outputs.isFirstLoad = Boolean(res && res.isFirstLoad);
outputs.execOut = true;
return;`
        }
      } 
    },
    { 
      type: 'resetLayer', 
      label: 'Reset Layer', 
      description: 'Resets a layer to its initial state from the scene template, clearing runtime modifications and restoring initial entities.', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Reset Layer', 
          headerColor: '#8E24AA', 
          category: 'Scene & Lifecycle' 
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'sceneName', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'layerName', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ], 
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'success', dataType: 'boolean', color: '#4CAF50' }
        ],
        data: {
          values: {
            sceneName: '',
            layerName: ''
          },
          code: 
`const sceneName = inputs.sceneName ? String(inputs.sceneName) : '';
const layerName = inputs.layerName ? String(inputs.layerName) : '';

const success = context.scene && typeof context.scene.resetLayer === 'function'
  ? context.scene.resetLayer(sceneName, layerName)
  : false;

outputs.success = Boolean(success);
outputs.execOut = true;
return;`
        }
      } 
    }
  ]
};
