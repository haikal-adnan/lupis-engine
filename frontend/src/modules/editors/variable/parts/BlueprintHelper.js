import { 
  GitMerge, 
  Timer
} from 'lucide-vue-next';

export const BlueprintHelper = {
  _id: 'flow_helper',
  label: 'Flow Helpers',
  color: '#607D8B',
  icon: GitMerge,
  items: [
    { 
      type: 'logic_flow_merge', 
      label: 'Merge Flow', 
      description: 'Menggabungkan banyak jalur eksekusi ke dalam satu output.',
      icon: GitMerge, 
      allowDynamicInputs: true,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Merge', headerColor: '#607D8B', category: 'Helper' },
        inputs: [
          { _id: 'in_0', label: 'In 1', dataType: 'execution', color: '#ffffff' },
          { _id: 'in_1', label: 'In 2', dataType: 'execution', color: '#ffffff' }
        ], 
        outputs: [
          { _id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    },
    { 
      type: 'logic_delay', 
      label: 'Delay', 
      description: 'Menunda eksekusi selama beberapa detik.',
      icon: Timer,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Delay', headerColor: '#607D8B', category: 'Helper' },
        data: { values: { duration: 1.0 } }, 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'duration', label: 'Duration (s)', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          { _id: 'out', label: 'Completed', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    }
  ]
};