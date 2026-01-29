import { Play, Pause, Square, Power, Flag } from 'lucide-vue-next';

export const basicLifecycle = {
  _id: 'category_game_flow',
  label: 'Game Lifecycle',
  color: '#EF4444',
  icon: Power,
  items: [
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
          {
            _id: 'out',
            label: 'Start',
            dataType: 'execution',
            color: '#ffffff'
          }
        ]
      }
    },
    {
      type: 'action_game_pause',
      label: 'Pause Game',
      description: 'Freezes the game loop update.',
      icon: Pause,
      defaultData: {
        settings: {
          headerTitle: 'Pause Game',
          headerColor: '#EF4444',
          category: 'Game Flow'
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' }
        ],
        outputs: [
          { _id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      }
    },
    {
      type: 'action_game_resume',
      label: 'Resume Game',
      description: 'Resumes the game loop update.',
      icon: Play,
      defaultData: {
        settings: {
          headerTitle: 'Resume Game',
          headerColor: '#EF4444',
          category: 'Game Flow'
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' }
        ],
        outputs: [
          { _id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      }
    },
    {
      type: 'action_game_toggle_pause',
      label: 'Toggle Pause',
      description: 'Switches between Pause and Resume.',
      icon: Pause,
      defaultData: {
        settings: {
          headerTitle: 'Toggle Pause',
          headerColor: '#F59E0B',
          category: 'Game Flow'
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' }
        ],
        outputs: [
          { _id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      }
    },
    {
      type: 'action_game_quit',
      label: 'Quit Game',
      description: 'Stops the game execution.',
      icon: Square,
      defaultData: {
        settings: {
          headerTitle: 'Quit / End Game',
          headerColor: '#000000',
          category: 'Game Flow'
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' }
        ],
        outputs: []
      }
    }
  ]
};
