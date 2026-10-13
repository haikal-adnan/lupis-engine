import { Power } from 'lucide-vue-next';

/**
 * ============================================================================
 * BLUEPRINT: GAME LIFECYCLE
 * ============================================================================
 */
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
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Tick',
          headerColor: '#3B82F6',
          category: 'Game Lifecycle'
        },
        inputs: [],
        outputs: [
          { id: 'out', label: 'Update', dataType: 'execution', color: '#FFFFFF' },
          { id: 'dt', label: 'Delta Time', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          code: 
`context.onTick((dt) => {
  const delta = Number(dt) || 0;
  outputs['Delta Time'] = delta;
  outputs['dt'] = delta;
  outputs['Update'] = true;
  outputs['out'] = true;
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
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Game Start',
          headerColor: '#10B981',
          category: 'Game Lifecycle'
        },
        inputs: [],
        outputs: [
          { id: 'out', label: 'Start', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`context.onGameStart(() => {
  outputs['Start'] = true;
  outputs['out'] = true;
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
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Game Pause',
          headerColor: '#EF4444',
          category: 'Game Lifecycle'
        },
        inputs: [],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`context.onGamePause(() => {
  outputs['Out'] = true;
  outputs['out'] = true;
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
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Game Resume',
          headerColor: '#10B981',
          category: 'Game Lifecycle'
        },
        inputs: [],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`context.onGameResume(() => {
  outputs['Out'] = true;
  outputs['out'] = true;
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
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Game Restart',
          headerColor: '#F59E0B',
          category: 'Game Lifecycle'
        },
        inputs: [],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`context.onGameRestart(() => {
  outputs['Out'] = true;
  outputs['out'] = true;
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
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Pause Game',
          headerColor: '#EF4444',
          category: 'Game Lifecycle'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' }
        ],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`if (context.game && typeof context.game.pauseGame === 'function') {
  context.game.pauseGame();
}

outputs['Out'] = true;
outputs['out'] = true;
return;`
        }
      }
    },

    {
      type: 'action_game_resume',
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
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' }
        ],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`if (context.game && typeof context.game.resumeGame === 'function') {
  context.game.resumeGame();
}

outputs['Out'] = true;
outputs['out'] = true;
return;`
        }
      }
    },

    {
      type: 'action_game_restart',
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
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' }
        ],
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`if (context.game && typeof context.game.restartGame === 'function') {
  context.game.restartGame();
}

outputs['Out'] = true;
outputs['out'] = true;
return;`
        }
      }
    }
  ]
};