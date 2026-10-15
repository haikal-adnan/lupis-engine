import { FolderTree } from 'lucide-vue-next';

export const BlueprintCollectionHelper = {
  id: 'category_collection_helper',
  label: 'Collection Helper',
  color: '#06B6D4',
  icon: FolderTree,
  items: [
    {
      type: 'getFromPath',
      label: 'Get Value by Path',
      description: 'Membaca nilai spesifik di dalam List atau Map menggunakan path string (cth: "users.0.name" atau "items[1].id").',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get from Path',
          headerColor: '#0891B2',
          category: 'Collection Helper'
        },
        inputs: [
          { id: 'collection', dataType: 'any', color: '#B0BEC5' },
          { id: 'path', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'value', dataType: 'any', color: '#B0BEC5' },
          { id: 'found', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            path: ''
          },
          code: 
`const col = inputs.collection;
const pathString = inputs.path;

const parts = pathString.split(/[.\\[\\]]+/).filter(p => p !== '');
let current = col;
let isFound = true;

for (let i = 0; i < parts.length; i++) {
  const part = parts[i];
  if (current && typeof current === 'object' && part in current) {
    current = current[part];
  } else {
    isFound = false;
    current = null;
    break;
  }
}

outputs.value = current;
outputs.found = isFound;
return;`
        }
      }
    },
    {
      type: 'setFromPath',
      label: 'Set Value by Path',
      description: 'Menetapkan atau memperbarui nilai di dalam List atau Map bersarang (nested) menggunakan path string.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set by Path',
          headerColor: '#0891B2',
          category: 'Collection Helper'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'collection', dataType: 'any', color: '#B0BEC5' },
          { id: 'path', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'collectionOut', dataType: 'any', color: '#B0BEC5' },
          { id: 'valueOut', dataType: 'any', color: '#B0BEC5' }
        ],
        data: {
          values: {
            path: ''
          },
          code: 
`const targetCol = context.assert.exists(inputs.collection, 'Target collection must not be null or undefined');
const pathString = inputs.path;
const newVal = inputs.value;

const cloned = Array.isArray(targetCol) ? [...targetCol] : { ...targetCol };
const parts = pathString.split(/[.\\[\\]]+/).filter(p => p !== '');
let current = cloned;

for (let i = 0; i < parts.length - 1; i++) {
  const part = parts[i];
  const nextPart = parts[i + 1];
  const isNextIndex = /^\d+$/.test(nextPart);

  if (!current[part]) {
    current[part] = isNextIndex ? [] : {};
  }
  current = current[part];
}

if (parts.length > 0) {
  const lastPart = parts[parts.length - 1];
  current[lastPart] = newVal;
}

outputs.collectionOut = cloned;
outputs.valueOut = newVal;
outputs.execOut = true;
return;`
        }
      }
    }
  ]
};