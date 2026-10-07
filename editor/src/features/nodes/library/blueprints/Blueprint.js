import { Boxes, Zap, Play, Calculator } from 'lucide-vue-next';


/** TODO: 

Check script for newer

ANIMATOR :

BOOLEAN :
logic_and (Done)
logic_or (Done)
logic_not (Done)

CAMERA :
action_camera_follow (Smoothness)
action_camera_stop_follow (Done)

COLLECTION HELPER :

COLLIDER : 
solid_collision (Critical)
trigger_zone (Done)


 */

/**
 * ============================================================================
 * TEMPLATE PANDUAN BLUEPRINT CATEGORY (LUPIS ENGINE)
 * ============================================================================
 *
 * Standar & Aturan Kode Blueprint:
 * 1. Tanpa Komentar Kode: Jangan menyertakan komentar (// atau /*) di dalam `data.code`.
 * 2. Tanpa Pengecekan / Guarding Berlebih: Langsung baca dari `inputs['Label Port']`.
 *    Pencegahan error / fallback nilai kosong ditangani langsung di level Engine.
 * 3. Node Dinamis (allowDynamicInputs: true):
 *    - Port default harus diberi label berurutan: 'Val 1', 'Val 2', dst.
 *    - Deklarasikan variabel satu per satu secara eksplisit: `const val1 = inputs['Val 1'];`
 *    - Kelompokkan ke dalam array: `const collection = [val1, val2];`
 *    - Engine/Store akan otomatis meregenerasi deklarasi & collection saat port ditambah/dihapus.
 * 4. Penutup Fungsi: Setiap string `data.code` WAJIB diakhiri dengan `return;`.
 *
 * DataType Port & Warna Standar:
 * - 'execution' : Alur eksekusi (Warna: #ffffff)
 * - 'string'    : Teks (Warna: #FFB74D)
 * - 'number'    : Angka/Float/Int (Warna: #B2FF59)
 * - 'boolean'   : True/False (Warna: #f472b6)
 * - 'entity'    : Entity Reference (Warna: #fbbf24)
 * - 'any'       : Tipe Data Bebas (Warna: #ffffff)
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
      description: 'Dicuplik/dijalankan saat event tertentu dipicu.',
      icon: Zap,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,

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
            color: '#ffffff'
          },
          {
            id: 'event_data',
            label: 'Data',
            dataType: 'string',
            color: '#FFB74D'
          }
        ],

        data: {
          code: `const eventData = node._tempData?.dataValue;

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
      icon: Play,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,

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
            color: '#ffffff'
          },
          {
            id: 'target_entity',
            label: 'Target Entity',
            dataType: 'string',
            color: '#FFB74D',
            defaultValue: 'self'
          },
          {
            id: 'value_amount',
            label: 'Amount',
            dataType: 'number',
            color: '#B2FF59',
            defaultValue: 100
          }
        ],

        outputs: [
          {
            id: 'out',
            label: 'Out',
            dataType: 'execution',
            color: '#ffffff'
          },
          {
            id: 'result',
            label: 'Result',
            dataType: 'boolean',
            color: '#f472b6'
          }
        ],

        data: {
          code: `const target = inputs['Target Entity'];
const amount = inputs['Amount'];
const entity = context.getEntity(target);

entity.applyAmount(amount);

outputs['Result'] = true;
outputs['Out'] = true;
return;`
        }
      }
    },

    // ------------------------------------------------------------------------
    // TIPE C: DYNAMIC INPUTS NODE (Pengolahan Variabel Banyak/Koleksi)
    // ------------------------------------------------------------------------
    {
      type: 'dynamic_example_node',
      label: 'Dynamic Collection',
      description: 'Menerima port input dinamis yang dapat ditambah atau dikurangi.',
      icon: Calculator,
      allowDynamicInputs: true,
      allowDynamicOutputs: false,

      defaultData: {
        settings: {
          headerTitle: 'Dynamic Collection',
          headerColor: '#00796B',
          category: 'Category Name'
        },

        inputs: [
          {
            id: 'v0',
            label: 'Val 1',
            dataType: 'number',
            color: '#B2FF59'
          },
          {
            id: 'v1',
            label: 'Val 2',
            dataType: 'number',
            color: '#B2FF59'
          }
        ],

        outputs: [
          {
            id: 'res',
            label: 'Result',
            dataType: 'number',
            color: '#B2FF59'
          }
        ],

        data: {
          values: {
            v0: 0,
            v1: 0
          },

          code: `const val1 = inputs['Val 1'];
const val2 = inputs['Val 2'];
const collection = [val1, val2];

outputs['Result'] = collection.reduce((acc, curr) => acc + curr, 0);
return;`
        }
      }
    }
  ]
};