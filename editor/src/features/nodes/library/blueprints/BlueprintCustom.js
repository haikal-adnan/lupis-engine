import { Cpu } from 'lucide-vue-next';

export const CUSTOM_NODE_TEMPLATE = {
  type: 'customScript',
  label: 'Custom Node',
  description: 'Custom script node with user-defined ports, parameters, and executable logic.',
  role: 'action',
  dynamicMode: 'none',
  defaultData: {
    isCustomScript: true,
    role: 'action',
    settings: {
      headerTitle: 'Custom Node',
      headerColor: '#8B5CF6',
      category: 'Custom',
      description: 'Custom script node with user-defined ports, parameters, and executable logic.'
    },
    inputs: [
      { id: 'execIn', dataType: 'execution', color: '#FFFFFF' }
    ],
    outputs: [
      { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
    ],
    data: {
      values: {},
      code: '\nreturn;'
    }
  }
};

export const BlueprintCustom = {
  id: 'custom',
  label: 'Custom',
  color: '#8B5CF6',
  icon: Cpu,
  items: []
};
