import { Play, Pause, Square, Power, Flag, Clock, RotateCcw } from 'lucide-vue-next';

export const BlueprintLifecycle = {
  id: 'category_game_flow',
  label: 'Game Lifecycle',
  color: '#EF4444',
  icon: Power,
  items: [
    {
      type: 'event_tick',
      label: 'On Tick',
      description: 'Runs every frame. Use for continuous logic.',
      icon: Clock,
      defaultData: {
        settings: {
          headerTitle: 'On Tick',
          headerColor: '#3B82F6',
          category: 'Events'
        },
        inputs: [],
        outputs: [
          { id: 'out', label: 'Update', dataType: 'execution', color: '#ffffff' },
          { id: 'dt', label: 'Delta Time', dataType: 'number', color: '#69F0AE' }
        ],
        data: {
          code: `context.onTick((dt) => {
  outputs['dt'] = dt;
  context.triggerFlow('out');
});
return;`
        }
      }
    },

    {
      type: 'event_game_start',
      label: 'On Game Start',
      description: 'Triggered once when the game begins.',
      icon: Flag,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: {
          headerTitle: 'On Game Start',
          headerColor: '#10B981',
          category: 'Events'
        },
        inputs: [],
        outputs: [
          { id: 'out', label: 'Start', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          code: `context.onGameStart(() => {
  context.triggerFlow('out');
});
return;`
        }
      }
    },

    {
      type: 'event_scene_start',
      label: 'On Scene Start',
      description: 'Triggered exactly once when the scene has successfully loaded and started.',
      icon: Flag,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: {
          headerTitle: 'On Scene Start',
          headerColor: '#059669',
          category: 'Events'
        },
        inputs: [],
        outputs: [
          { id: 'out', label: 'Start', dataType: 'execution', color: '#ffffff' },
          { id: 'scene_name', label: 'Scene Name', dataType: 'string', color: '#FCD34D' }
        ],
        data: {
          code: `context.onSceneStart((sceneName) => {
  node._tempData = node._tempData || {};
  node._tempData['scene_name'] = sceneName;
  outputs['scene_name'] = sceneName;
  context.triggerFlow('out');
});
return;`
        }
      }
    },

    {
      type: 'event_game_pause',
      label: 'On Game Pause',
      description: 'Triggered when the game is paused.',
      icon: Pause,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: {
          headerTitle: 'On Game Pause',
          headerColor: '#EF4444',
          category: 'Events'
        },
        inputs: [],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          code: `context.onGamePause(() => {
  context.triggerFlow('out');
});
return;`
        }
      }
    },

    {
      type: 'event_game_resume',
      label: 'On Game Resume',
      description: 'Triggered when the game is resumed.',
      icon: Play,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: {
          headerTitle: 'On Game Resume',
          headerColor: '#10B981',
          category: 'Events'
        },
        inputs: [],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          code: `context.onGameResume(() => {
  context.triggerFlow('out');
});
return;`
        }
      }
    },

    {
      type: 'event_game_restart',
      label: 'On Game Restart',
      description: 'Triggered when the entire game is restarted.',
      icon: RotateCcw,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: {
          headerTitle: 'On Game Restart',
          headerColor: '#F59E0B',
          category: 'Events'
        },
        inputs: [],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          code: `context.onGameRestart(() => {
  context.triggerFlow('out');
});
return;`
        }
      }
    },

    {
      type: 'action_game_pause',
      label: 'Pause Game',
      description: 'Freezes gameplay physics and logic update.',
      icon: Pause,
      defaultData: {
        settings: {
          headerTitle: 'Pause Game',
          headerColor: '#EF4444',
          category: 'Game Flow'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' }
        ],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          code: `context.game.pauseGame();
outputs['out'] = true;
return;`
        }
      }
    },

    {
      type: 'action_game_resume',
      label: 'Resume Game',
      description: 'Resumes gameplay physics and logic update.',
      icon: Play,
      defaultData: {
        settings: {
          headerTitle: 'Resume Game',
          headerColor: '#10B981',
          category: 'Game Flow'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' }
        ],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          code: `context.game.resumeGame();
outputs['out'] = true;
return;`
        }
      }
    },

    {
      type: 'action_game_restart',
      label: 'Restart Game',
      description: 'Resets all global variables and reloads the initial scene.',
      icon: RotateCcw,
      defaultData: {
        settings: {
          headerTitle: 'Restart Game',
          headerColor: '#EF4444',
          category: 'Game Flow'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' }
        ],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          code: `context.game.restartGame();
outputs['out'] = true;
return;`
        }
      }
    },

    {
      type: 'action_scene_restart',
      label: 'Restart Scene',
      description: 'Reloads the current active scene without resetting global variables.',
      icon: RotateCcw,
      defaultData: {
        settings: {
          headerTitle: 'Restart Scene',
          headerColor: '#F59E0B',
          category: 'Game Flow'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' }
        ],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          code: `context.scene.restart();
outputs['out'] = true;
return;`
        }
      }
    }
  ]
};