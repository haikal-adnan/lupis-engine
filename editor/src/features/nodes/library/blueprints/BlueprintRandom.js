import { 
  Dices, 
  ToggleLeft, 
  Percent, 
  Shuffle,
  Palette
} from 'lucide-vue-next';

export const BlueprintRandom = {
  id: 'random_operations',
  label: 'Random Operations',
  color: '#FF5722', 
  icon: Dices,
  items: [
    { 
      type: 'random_smart', 
      label: 'Random Number', 
      description: 'Generates a random number. Outputs an integer if inputs are integers, or a float if inputs are decimals.',
      icon: Dices,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Random Number', headerColor: '#FF5722', category: 'Random' },
        data: { 
          values: { min: 1, max: 10 },
          code: `const min = Number(inputs.min);
const max = Number(inputs.max);

if (Number.isInteger(min) && Number.isInteger(max)) {
  outputs.result = Math.floor(Math.random() * (max - min + 1)) + min;
} else {
  outputs.result = Math.random() * (max - min) + min;
}
return;`
        },
        inputs: [
          { id: 'min', label: 'Min', dataType: 'number', color: '#00BCD4', defaultValue: 1 },
          { id: 'max', label: 'Max', dataType: 'number', color: '#00BCD4', defaultValue: 10 }
        ], 
        outputs: [
          { id: 'result', label: 'Number', dataType: 'number', color: '#00BCD4' }
        ]
      } 
    },
    { 
      type: 'random_boolean', 
      label: 'Random Boolean', 
      description: 'Generates a random true or false value (50:50 chance).',
      icon: ToggleLeft,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Random Bool', headerColor: '#FF5722', category: 'Random' },
        data: {
          code: `outputs.result = Math.random() < 0.5;
return;`
        }, 
        inputs: [], 
        outputs: [
          { id: 'result', label: 'Boolean', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },
    { 
      type: 'random_from_list', 
      label: 'List Get Random', 
      description: 'Retrieves a single random item from within the provided List or Array.',
      icon: Shuffle,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Random From List', headerColor: '#FF5722', category: 'Random' },
        data: {
          code: `const list = inputs.list;
outputs.item = Array.isArray(list) && list.length > 0 
  ? list[Math.floor(Math.random() * list.length)] 
  : null;
return;`
        },
        inputs: [
          { id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' }
        ], 
        outputs: [
          { id: 'item', label: 'Item', dataType: 'any', color: '#FFFFFF' }
        ]
      } 
    },
    { 
      type: 'random_chance', 
      label: 'Random Chance', 
      description: 'Outputs true (Success) or false (Failure) based on a specified probability percentage (0 - 100).',
      icon: Percent,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Random Chance', headerColor: '#FF5722', category: 'Random' },
        data: { 
          values: { chance: 25 },
          code: `outputs.result = (Math.random() * 100) < Number(inputs.chance);
return;`
        }, 
        inputs: [
          { id: 'chance', label: 'Chance (%)', dataType: 'number', color: '#00BCD4', defaultValue: 25 }
        ], 
        outputs: [
          { id: 'result', label: 'Boolean', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },
    { 
      type: 'random_color', 
      label: 'Random Color', 
      description: 'Generates a random color formatted as a Hex string (e.g., #A3F10C).',
      icon: Palette,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Random Color', headerColor: '#FF5722', category: 'Random' },
        data: {
          code: `outputs.color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
return;`
        },
        inputs: [], 
        outputs: [
          { id: 'color', label: 'Color (Hex)', dataType: 'string', color: '#FFFFFF' }
        ]
      } 
    }
  ]
};