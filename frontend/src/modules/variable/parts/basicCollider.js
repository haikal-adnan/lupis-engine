import { BoxSelect, ScanLine, Tag } from 'lucide-vue-next';

export const basicCollider = {
  _id: 'game_physics',
  label: 'Collider System',
  color: '#FF9800',
  icon: BoxSelect,
  items: [
    { 
      type: 'solid_collision', 
      label: 'Solid Collision', 
      description: 'Check if an object is hitting a solid wall or obstacle.', // [NEW] Description
      icon: BoxSelect,
      defaultData: { 
        settings: { headerTitle: 'Solid Collision', headerColor: '#D32F2F', category: 'Physics' },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution' },
          { _id: 'target', label: 'Target', dataType: 'string' },
          { _id: 'filter_tag', label: 'Filter Tag', dataType: 'string', icon: Tag }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution' },
          { _id: 'on_hit', label: 'On Hit', dataType: 'execution', color: '#FF5252' },
          { _id: 'is_colliding', label: 'Is Colliding?', dataType: 'boolean', color: '#69F0AE' },
          { _id: 'hit_id', label: 'Hit ID', dataType: 'string' }
        ]
      } 
    },
    { 
      type: 'trigger_zone', 
      label: 'Trigger Zone', 
      description: 'Detects when an object enters, stays, or exits an area.', // [NEW] Description
      icon: ScanLine,
      defaultData: { 
        settings: { headerTitle: 'Trigger Zone', headerColor: '#0097A7', category: 'Physics' },
        inputs: [
          // [UPDATED] Mengganti 'Check (Tick)' menjadi 'In' standar
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'target', label: 'Target', dataType: 'string' },
          { _id: 'filter_tag', label: 'Filter Tag', dataType: 'string', icon: Tag }
        ],
        outputs: [
          // [NEW] Output Passthrough
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          
          { _id: 'on_enter', label: 'On Enter', dataType: 'execution', color: '#69F0AE' },
          { _id: 'on_exit', label: 'On Exit', dataType: 'execution', color: '#FFAB91' },
          { _id: 'is_inside', label: 'Is Inside?', dataType: 'boolean', color: '#69F0AE' },
          { _id: 'other_id', label: 'Other ID', dataType: 'string' }
        ]
      } 
    }
  ]
};