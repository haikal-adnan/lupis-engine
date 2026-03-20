import { Box, Scan, Settings2, PackagePlus, Copy, Trash2 } from 'lucide-vue-next';

export const BlueprintObject = {
  _id: 'game_object_basic',
  label: 'Basic Entity',
  color: '#607D8B',
  icon: Box,
  items: [
    { 
      type: 'get_object', 
      label: 'Get Object Info', 
      description: 'Get generic info like ID, Name, Tag, Active', 
      icon: Scan, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Object', headerColor: '#455A64', category: 'General' },
        data: {
          propertyOptions: [
            { value: 'entityId', label: 'Entity ID', type: 'string', color: '#FFF' },
            { value: 'name', label: 'Name', type: 'string', color: '#FFF' },
            { value: 'tag', label: 'Tag', type: 'string', color: '#FF9800' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#4CAF50' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#2196F3' },
          ]
        },
        inputs: [{ _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }], 
        outputs: [] 
      } 
    },
    { 
      type: 'set_object', 
      label: 'Set Object Info', 
      description: 'Set generic info like Name, Tag, Active', 
      icon: Settings2,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Object', headerColor: '#455A64', category: 'General' },
        data: {
          propertyOptions: [
            { value: 'name', label: 'Name', type: 'string', color: '#FFF' },
            { value: 'tag', label: 'Tag', type: 'string', color: '#FF9800' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#4CAF50' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#2196F3' },
          ]
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ], 
        outputs: [{ _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }]
      } 
    },
    // --- NODE BARU MULAI DARI SINI ---
    {
      type: 'spawn_from_prefab',
      label: 'Spawn from Prefab',
      description: 'Spawns a new entity into the world using a Prefab template.',
      icon: PackagePlus,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: { headerTitle: 'Spawn Prefab', headerColor: '#2E7D32', category: 'Lifecycle' },
        data: {
          values: {
            // Nilai default X dan Y diatur di sini
            pos_x: 0,
            pos_y: 0
          }
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'prefab_id', label: 'Prefab ID', dataType: 'string', color: '#FFF' },
          // Input X dan Y dipisah, menggunakan tipe number
          { _id: 'pos_x', label: 'Position X', dataType: 'number', color: '#69F0AE' }, 
          { _id: 'pos_y', label: 'Position Y', dataType: 'number', color: '#69F0AE' }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { _id: 'new_entity', label: 'New Entity ID', dataType: 'string', color: '#E040FB' }
        ]
      }
    },
    {
      type: 'clone_entity',
      label: 'Clone Entity',
      description: 'Duplicates an existing entity in the scene with a new ID.',
      icon: Copy,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: { headerTitle: 'Clone Entity', headerColor: '#E65100', category: 'Lifecycle' },
        data: {
          values: {
            force_active: true,
            // Nilai default X dan Y diatur di sini
            pos_x: 0,
            pos_y: 0
          }
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'target_id', label: 'Target ID', dataType: 'string', color: '#E040FB' },
          // Input X dan Y dipisah, menggunakan tipe number
          { _id: 'pos_x', label: 'Position X', dataType: 'number', color: '#69F0AE' },
          { _id: 'pos_y', label: 'Position Y', dataType: 'number', color: '#69F0AE' },
          { _id: 'force_active', label: 'Force Active', dataType: 'boolean', color: '#4CAF50' }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { _id: 'new_entity', label: 'Cloned Entity ID', dataType: 'string', color: '#E040FB' }
        ]
      }
    },
    {
      type: 'destroy_entity',
      label: 'Destroy Entity',
      description: 'Permanently removes an entity from the game world.',
      icon: Trash2,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: { headerTitle: 'Destroy Entity', headerColor: '#C62828', category: 'Lifecycle' },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'target_id', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      }
    }
  ]
};