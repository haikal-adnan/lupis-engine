import { Power } from 'lucide-vue-next';

export const BlueprintLifecycle = {
  id: 'category_game_flow',
  label: 'Game Lifecycle',
  color: '#EF4444',
  icon: Power,
  items: [
    {
      type: 'eventTick',
      label: 'On Tick',
      description: 'Runs every frame. Use for continuous logic.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Tick',
          headerColor: '#3B82F6',
          category: 'Game Lifecycle'
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
      description: 'Triggered once when the game begins.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Game Start',
          headerColor: '#10B981',
          category: 'Game Lifecycle'
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
      description: 'Triggered when the game is paused.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Game Pause',
          headerColor: '#EF4444',
          category: 'Game Lifecycle'
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
      description: 'Triggered when the game is resumed.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Game Resume',
          headerColor: '#10B981',
          category: 'Game Lifecycle'
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
      description: 'Triggered when the entire game is restarted.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Game Restart',
          headerColor: '#F59E0B',
          category: 'Game Lifecycle'
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
      type: 'actionGamePause',
      label: 'Pause Game',
      description: 'Freezes gameplay physics and logic update.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Pause Game',
          headerColor: '#EF4444',
          category: 'Game Lifecycle'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`context.lifecycle.pause();
outputs.execOut = true;
return;`
        }
      }
    },

    {
      type: 'actionGameResume',
      label: 'Resume Game',
      description: 'Resumes gameplay physics and logic update.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Resume Game',
          headerColor: '#10B981',
          category: 'Game Lifecycle'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`context.lifecycle.resume();
outputs.execOut = true;
return;`
        }
      }
    },

    {
      type: 'actionGameRestart',
      label: 'Restart Game',
      description: 'Resets all global variables and reloads the initial scene.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Restart Game',
          headerColor: '#EF4444',
          category: 'Game Lifecycle'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`context.lifecycle.restart();
outputs.execOut = true;
return;`
        }
      }
    }
  ]
};