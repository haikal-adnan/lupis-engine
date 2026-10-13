import { Boxes } from 'lucide-vue-next';

/**
 * ============================================================================
 * TEMPLATE PANDUAN BLUEPRINT CATEGORY (LUPIS ENGINE) - STANDAR BARU
 * ============================================================================
 *
 * Standar & Aturan Kode Blueprint:
 * 1. Tanpa Komentar Kode: Jangan menyertakan komentar (// atau /*) di dalam `data.code`.
 * 2. Tanpa Icon per Item: Icon hanya digunakan pada level Kategori (`icon: Boxes`).
 * 3. Format Code New Line: Penulisan string `code` selalu dimulai langsung dari baris baru (\n).
 * 4. Standar Mode Dinamis (`dynamicMode`):
 *    - 'none'           : Port statis (fixed).
 *    - 'sequential'     : Tambah port berurutan otomatis (Val 1, Val 2, ... / v0, v1, ...).
 *    - 'inputProperty'  : Membuka dropdown opsi `data.propertyOptions` untuk menambah INPUT PORT.
 *    - 'outputProperty' : Membuka dropdown opsi `data.propertyOptions` untuk menambah OUTPUT PORT.
 * 5. Pembacaan Inputs Runtime:
 *    - Akses inputs mendukung fallback ID maupun Label: `inputs['Target Entity'] ?? inputs['target_in']`.
 *    - Pada node 'sequential', evaluasi seluruh koleksi via `Object.values(inputs)`.
 * 6. Penutup Fungsi: Setiap string `data.code` WAJIB diakhiri dengan `return;`.
 *
 * DataType Port & Kode Warna Standar (Sesuai VAR_COLORS):
 * - 'execution' : Alur eksekusi        (Warna: #FFFFFF)
 * - 'string'    : Teks                 (Warna: #F48FB1)
 * - 'number'    : Angka/Float/Int      (Warna: #64B5F6)
 * - 'boolean'   : True/False           (Warna: #E57373)
 * - 'list'      : Array/Koleksi        (Warna: #4DD0E1)
 * - 'map'       : Object/Dictionary    (Warna: #FF8A65)
 * - 'any'       : Tipe Data Bebas      (Warna: #B0BEC5)
 * ============================================================================
 */

export const BlueprintCategoryTemplate = {
  // 🏷️ 1. METADATA KATEGORI
  id: 'category_template',
  label: 'Category Name',
  color: '#3B82F6',
  icon: Boxes,

  // 📦 2. DAFTAR NODE DALAM KATEGORI
  items: [
    // ------------------------------------------------------------------------
    // TIPE A: EVENT NODE (Pemicu Alur Eksekusi / Signal Trigger)
    // ------------------------------------------------------------------------
    {
      type: 'event_example_node',
      label: 'On Custom Event',
      description: 'Dipicu saat event tertentu dieksekusi oleh sistem.',
      dynamicMode: 'none',

      defaultData: {
        settings: {
          headerTitle: 'On Custom Event',
          headerColor: '#3B82F6',
          category: 'Category Name'
        },

        inputs: [],

        outputs: [
          {
            id: 'out',
            label: 'Out',
            dataType: 'execution',
            color: '#FFFFFF'
          },
          {
            id: 'event_data',
            label: 'Data',
            dataType: 'string',
            color: '#F48FB1'
          }
        ],

        data: {
          code: 
`const eventData = node._tempData?.dataValue;

outputs['Data'] = eventData;
outputs['Out'] = true;
return;`
        }
      }
    },

    // ------------------------------------------------------------------------
    // TIPE B: ACTION / PURE NODE (Statis / Fixed Inputs)
    // ------------------------------------------------------------------------
    {
      type: 'action_example_node',
      label: 'Do Something',
      description: 'Mengeksekusi aksi pada target entity atau sistem.',
      dynamicMode: 'none',

      defaultData: {
        settings: {
          headerTitle: 'Do Something',
          headerColor: '#F59E0B',
          category: 'Category Name'
        },

        inputs: [
          {
            id: 'exec_in',
            label: 'In',
            dataType: 'execution',
            color: '#FFFFFF'
          },
          {
            id: 'target_in',
            label: 'Target Entity',
            dataType: 'string',
            color: '#FFB74D',
            defaultValue: 'self'
          },
          {
            id: 'amount',
            label: 'Amount',
            dataType: 'number',
            color: '#64B5F6',
            defaultValue: 100
          }
        ],

        outputs: [
          {
            id: 'exec_out',
            label: 'Out',
            dataType: 'execution',
            color: '#FFFFFF'
          },
          {
            id: 'result',
            label: 'Result',
            dataType: 'boolean',
            color: '#E57373'
          }
        ],

        data: {
          values: {
            target_in: 'self',
            amount: 100
          },

          code: 
`const target = inputs['Target Entity'] ?? inputs['target_in'] ?? 'self';
const amount = Number(inputs['Amount'] ?? inputs['amount'] ?? 0);
const entity = context.entity.get(target);

if (entity && typeof entity.applyAmount === 'function') {
    entity.applyAmount(amount);
}

outputs['Result'] = true;
outputs['Out'] = true;
return;`
        }
      }
    },

    // ------------------------------------------------------------------------
    // TIPE C: SEQUENTIAL DYNAMIC NODE (Operasi Beruntun N-Input)
    // ------------------------------------------------------------------------
    {
      type: 'dynamic_sequential_node',
      label: 'Sequential Collection',
      description: 'Menambah/mengurangi port berurutan otomatis (Val 1, Val 2, ...).',
      dynamicMode: 'sequential',

      defaultData: {
        settings: {
          headerTitle: 'Sequential Collection',
          headerColor: '#00796B',
          category: 'Category Name'
        },

        inputs: [
          {
            id: 'v0',
            label: 'Val 1',
            dataType: 'number',
            color: '#64B5F6'
          },
          {
            id: 'v1',
            label: 'Val 2',
            dataType: 'number',
            color: '#64B5F6'
          }
        ],

        outputs: [
          {
            id: 'res',
            label: 'Result',
            dataType: 'number',
            color: '#64B5F6'
          }
        ],

        data: {
          values: {
            v0: 0,
            v1: 0
          },

          code: 
`const numbers = Object.values(inputs).map(v => Number(v) || 0);
outputs['Result'] = numbers.reduce((acc, curr) => acc + curr, 0);
outputs['res'] = outputs['Result'];
return;`
        }
      }
    },

    // ------------------------------------------------------------------------
    // TIPE D: INPUT PROPERTY DYNAMIC NODE (Opsi Input Properti dari Dropdown)
    // ------------------------------------------------------------------------
    {
      type: 'dynamic_set_property_node',
      label: 'Set Entity Property',
      description: 'Menambah port input secara dinamis berdasarkan opsi properti.',
      dynamicMode: 'inputProperty',

      defaultData: {
        settings: {
          headerTitle: 'Set Property',
          headerColor: '#2E7D32',
          category: 'Category Name'
        },

        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ],

        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],

        data: {
          values: { target_in: 'self' },
          propertyOptions: [
            { value: 'speed', label: 'Move Speed', type: 'number', color: '#64B5F6' },
            { value: 'health', label: 'Health', type: 'number', color: '#64B5F6' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' }
          ],

          code: 
`const targetId = inputs['Target Entity'] ?? inputs['target_in'] ?? 'self';
const entity = context.entity.get(targetId);

if (entity) {
    const speed = inputs['Move Speed'] ?? inputs['speed'];
    const health = inputs['Health'] ?? inputs['health'];
    const visible = inputs['Visible'] ?? inputs['visible'];

    if (speed !== undefined && speed !== null && speed !== '') entity.speed = Number(speed);
    if (health !== undefined && health !== null && health !== '') entity.health = Number(health);
    if (visible !== undefined && visible !== null) entity.visible = Boolean(visible);
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },

    // ------------------------------------------------------------------------
    // TIPE E: OUTPUT PROPERTY DYNAMIC NODE (Opsi Output Properti dari Dropdown)
    // ------------------------------------------------------------------------
    {
      type: 'dynamic_get_property_node',
      label: 'Get Entity Property',
      description: 'Menambah port output secara dinamis berdasarkan opsi properti.',
      dynamicMode: 'outputProperty',

      defaultData: {
        settings: {
          headerTitle: 'Get Property',
          headerColor: '#2E7D32',
          category: 'Category Name'
        },

        inputs: [
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ],

        outputs: [],

        data: {
          values: { target_in: 'self' },
          propertyOptions: [
            { value: 'speed', label: 'Move Speed', type: 'number', color: '#64B5F6' },
            { value: 'health', label: 'Health', type: 'number', color: '#64B5F6' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' }
          ],

          code: 
`const targetId = inputs['Target Entity'] ?? inputs['target_in'] ?? 'self';
const entity = context.entity.get(targetId);

if (entity) {
    outputs['Move Speed'] = entity.speed ?? 0;
    outputs['speed'] = entity.speed ?? 0;
    outputs['Health'] = entity.health ?? 0;
    outputs['health'] = entity.health ?? 0;
    outputs['Visible'] = entity.visible ?? true;
    outputs['visible'] = entity.visible ?? true;
}
return;`
        }
      }
    }
  ]
};