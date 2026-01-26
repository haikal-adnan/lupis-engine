import { FileText } from 'lucide-vue-next';

export const basicString = {
  id: 'basic_string',
  label: 'String Utils',
  color: '#FF9800', 
  icon: FileText,
  items: [
    { 
      type: 'format_string', 
      label: 'Format String', 
      description: 'Combine text like "Pos: {0}, {1}"', 
      // HAPUS DARI SINI
      // allowDynamicInputs: true, 
      
      defaultData: { 
        // PINDAHKAN KESINI (Agar otomatis ikut ke-spread saat onDrop)
        allowDynamicInputs: true, 

        settings: { 
          headerTitle: 'Format String', 
          headerColor: '#F57C00', 
          category: 'String',
        },
        data: { 
          format: '' 
        },
        inputs: [
          { _id: '0', label: '{0}', dataType: 'any', color: '#fff' },
          { _id: '1', label: '{1}', dataType: 'any', color: '#fff' },
        ],
        outputs: [
          { _id: 'out', label: 'Result', dataType: 'string', color: '#FFB74D' }
        ]
      } 
    }
  ]
};