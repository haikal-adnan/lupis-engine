import { Dices } from 'lucide-vue-next';

export const BlueprintRandom = {
  id: 'random_operations',
  label: 'Random Operations',
  color: '#FF5722',
  icon: Dices,
  items: [
    {
      type: 'randomSmart',
      label: 'Random Number',
      description: 'Generates a random number. Outputs an integer if inputs are integers, or a float if inputs are decimals.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Random Number',
          headerColor: '#FF5722',
          category: 'Random Operations'
        },
        inputs: [
          { id: 'min', dataType: 'number', color: '#64B5F6', defaultValue: 1 },
          { id: 'max', dataType: 'number', color: '#64B5F6', defaultValue: 10 }
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { min: 1, max: 10 },
          code: 
`const min = inputs.min;
const max = inputs.max;

let res = 0;
if (Number.isInteger(min) && Number.isInteger(max)) {
  res = Math.floor(Math.random() * (max - min + 1)) + min;
} else {
  res = Math.random() * (max - min) + min;
}

outputs.result = res;
return;`
        }
      }
    },
    {
      type: 'randomBoolean',
      label: 'Random Boolean',
      description: 'Generates a random true or false value (50:50 chance).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Random Bool',
          headerColor: '#FF5722',
          category: 'Random Operations'
        },
        inputs: [],
        outputs: [
          { id: 'result', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          code: 
`outputs.result = Math.random() < 0.5;
return;`
        }
      }
    },
    {
      type: 'randomFromList',
      label: 'List Get Random',
      description: 'Retrieves a single random item from within the provided List or Array.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Random From List',
          headerColor: '#FF5722',
          category: 'Random Operations'
        },
        inputs: [
          { id: 'list', dataType: 'list', color: '#4DD0E1' }
        ],
        outputs: [
          { id: 'item', dataType: 'any', color: '#B0BEC5' }
        ],
        data: {
          code: 
`const list = inputs.list;
outputs.item = list[Math.floor(Math.random() * list.length)];
return;`
        }
      }
    },
    {
      type: 'randomChance',
      label: 'Random Chance',
      description: 'Outputs true (Success) or false (Failure) based on a specified probability percentage (0 - 100).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Random Chance',
          headerColor: '#FF5722',
          category: 'Random Operations'
        },
        inputs: [
          { id: 'chance', dataType: 'number', color: '#64B5F6', defaultValue: 25 }
        ],
        outputs: [
          { id: 'result', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { chance: 25 },
          code: 
`outputs.result = (Math.random() * 100) < inputs.chance;
return;`
        }
      }
    },
    {
      type: 'randomColor',
      label: 'Random Color',
      description: 'Generates a random color formatted as a Hex string (e.g., #A3F10C).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Random Color',
          headerColor: '#FF5722',
          category: 'Random Operations'
        },
        inputs: [],
        outputs: [
          { id: 'color', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          code: 
`outputs.color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
return;`
        }
      }
    }
  ]
};