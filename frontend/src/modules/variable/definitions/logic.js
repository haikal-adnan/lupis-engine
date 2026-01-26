import { Box, GitBranch, Repeat } from 'lucide-vue-next';

export const logicGroup = {
  id: 'logic',
  label: 'Flow & Logic',
  color: '#FF9800', // Orange
  icon: Box,
  items: [
    { 
      type: 'logic_branch', 
      label: 'Branch', 
      description: 'If / Else condition', 
      defaultData: { 
        settings: { headerTitle: 'Branch', headerColor: '#EF6C00', category: 'Logic' },
        inputs: [
          { _id: 'in', label: 'In', type: 'execution', color: '#fff' },
          { _id: 'condition', label: 'Condition', type: 'boolean', color: '#FF5252' }
        ],
        outputs: [
          { _id: 'true', label: 'True', type: 'execution', color: '#fff' },
          { _id: 'false', label: 'False', type: 'execution', color: '#fff' }
        ]
      } 
    },
    { 
      type: 'logic_loop', 
      label: 'Loop', 
      description: 'Repeat X times', 
      defaultData: { 
        settings: { headerTitle: 'For Loop', headerColor: '#E65100', category: 'Logic' },
        data: { loops: 10 },
        inputs: [
          { _id: 'in', label: 'In', type: 'execution', color: '#fff' },
          { _id: 'count', label: 'Count', type: 'number', color: '#B2FF59' }
        ],
        outputs: [
          { _id: 'loop', label: 'Loop Body', type: 'execution', color: '#fff' },
          { _id: 'completed', label: 'Completed', type: 'execution', color: '#fff' },
          { _id: 'index', label: 'Index', type: 'number', color: '#B2FF59' }
        ]
      } 
    },
    { 
      type: 'logic_sequence', 
      label: 'Sequence', 
      description: 'Run multiple outputs in order', 
      defaultData: { 
        settings: { headerTitle: 'Sequence', headerColor: '#F57C00', category: 'Logic' },
        inputs: [{ _id: 'in', label: 'In', type: 'execution', color: '#fff' }],
        outputs: [
          { _id: '0', label: 'Then 0', type: 'execution', color: '#fff' },
          { _id: '1', label: 'Then 1', type: 'execution', color: '#fff' }
          // Nanti bisa ditambah tombol + untuk add pin
        ]
      } 
    }
  ]
};