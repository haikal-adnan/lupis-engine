import { Boxes } from 'lucide-vue-next';

/**
 * ============================================================================
 * TEMPLATE PANDUAN BLUEPRINT CATEGORY (LUPIS ENGINE) - STANDAR BARU
 * ============================================================================
 *
 * Standar & Aturan Kode Blueprint:
 * 1. Tanpa Komentar Kode: Dilarang menyertakan komentar (// atau /*) di dalam `data.code`.
 * 2. Tanpa Icon per Item: Icon hanya didefinisikan pada level Kategori (`icon: Boxes`).
 * 3. Format Code New Line: Penulisan string `code` selalu dimulai langsung dari baris baru (\n).
 * 4. Aturan Port ID (T-001):
 *    - Pola Regex: ^[A-Za-z][A-Za-z0-9]*$ (panjang 1–32 karakter, camelCase, case-sensitive).
 *    - Dilarang: spasi, garis bawah (_), tanda hubung (-), titik (.), simbol, atau diawali angka.
 * 5. Standar Nama Port Baku (Kamus Kanonikal):
 *    Semua port WAJIB memakai nama dari kamus ini. Nama baru ditambahkan ke kamus
 *    lebih dulu (ikuti aturan 10), baru dipakai di blueprint.
 *    - Alur Eksekusi Utama:
 *        * Masuk: `execIn`
 *        * Keluar: `execOut`
 *    - Alur Eksekusi Percabangan & Loop:
 *        * `onTrue`, `onFalse`, `loopBody`, `completed`, `onHit`, `onComplete`
 *        * Tambahan: `onElse`, `onDefault`
 *    - Callback & Event Eksekusi (pola `on` + Peristiwa):
 *        * `onStart`, `onUpdate`, `onReady`, `onCooling`
 *        * `onClick`, `onDrag`, `onHover`, `onDown`, `onHold`, `onUp`
 *        * `onEnter`, `onExit`
 *    - Target & Entitas:
 *        * `targetEntity`, `sourceEntity`, `entityName`, `tag`
 *        * Tambahan: `selfEntity`, `otherEntity`, `parentEntity`, `childEntity`,
 *          `childEntities`, `prefabName`, `targetLayer`, `layerId`, `customId`,
 *          `clipId`, `sceneName`, `signalName`
 *    - Transform & Physics:
 *        * `position`, `rotation`, `scale`, `x`, `y`, `z`, `velocity`, `force`
 *        * Tambahan: `velocityX`, `velocityY`, `deltaX`, `deltaY`, `offsetX`, `offsetY`,
 *          `axisX`, `axisY`, `fromX`, `fromY`, `toX`, `toY`, `x1`, `y1`, `x2`, `y2`,
 *          `directionX`, `directionY`, `angle`, `smoothSpeed`, `zIndex`
 *    - Nilai, Hitungan & Operand:
 *        * `value`, `amount`, `count`, `a`, `b`, `result`
 *        * Tambahan: `length`, `size`, `min`, `max`, `start`, `end`, `step`,
 *          `startValue`, `endValue`, `chance`, `compare`, `condition`, `mode`, `speed`,
 *          `lerpSpeed`, `color`, `text`, `format`, `separator`, `source`, `message`,
 *          `data`, `pretty`, `reset`, `found`, `volume`, `pitch`, `audioType`
 *    - Status Boolean (pola `is`/`has`/`use`):
 *        * `isDown`, `isColliding`, `isInside`, `isHovering`, `isHolding`, `isTyping`,
 *          `hasTarget`, `useRaycast`, `useColliderBounds`, `isMute`
 *    - Waktu & Durasi:
 *        * `deltaTime`, `duration`, `delay`
 *    - Koleksi & Data:
 *        * `list`, `map`, `item`, `key`, `index`, `eventData`
 *        * Tambahan: `collection`, `path`, `listA`, `listB`, `mapA`, `mapB`, `keysList`,
 *          `valuesList`, `listOut`, `mapOut`, `collectionOut`, `valueOut`
 *    - Input Perangkat (Keyboard & Efek UI):
 *        * `keys`, `action`, `upKey`, `downKey`, `leftKey`, `rightKey`
 *        * `scaleNormal`, `scaleHover`, `scalePressed`
 *    - Sequential Dynamic:
 *        * `v0`, `v1`, `v2`, ...
 * 6. Penghapusan Port Label:
 *    - Properti `label` pada objek port DIHAPUS. Hanya gunakan `id`.
 * 7. Pemanfaatan context.assert & context.console (Zero Defensive Null Checking & Fallback):
 *    - Dilarang menggunakan `??`, `?.`, `||` fallback, `if (!entity)`, atau silent return pada invariant engine.
 *    - Ketika node membutuhkan entitas, komponen, atau tipe data tertentu, WAJIB menggunakan `context.assert.exists(...)`,
 *      `context.assert.hasComponent(...)`, `context.assert.isNumber(...)`, dll.
 *    - Jika invariant dilanggar, `context.assert` seketika melempar `ScriptAssertionError`, memancarkan event `console:error`,
 *      dan menghentikan alur seketika pada node tersebut tanpa mengeksekusi port alur keluar (zero downstream leakage).
 *    - Seluruh operasi logging, peringatan, dan error output menggunakan `context.console.log`, `context.console.warn`, `context.console.error`.
 * 8. Tanpa Akses Langsung context.game:
 *    - Node code DILARANG memanggil `context.game`. Semua operasi harus lewat perantara domain:
 *      `context.entity`, `context.layer`, `context.collider`, `context.input`, `context.ui`,
 *      `context.signal`, `context.lifecycle`, `context.transition`, `context.camera`, `context.scene`,
 *      `context.state`, `context.console`, dan `context.assert`.
 * 8. Pembacaan Inputs & Penulisan Outputs Runtime (T-403 & T-404):
 *    - Akses inputs langsung via ID: `inputs.targetEntity` atau `inputs.amount`.
 *    - Penulisan outputs langsung via ID satu assignment: `outputs.result = true`.
 *    - Dilarang akses bracket berbasis string: `inputs['Target']`, `outputs['Out']`.
 * 9. Penutup Fungsi: Setiap string `data.code` WAJIB diakhiri dengan `return;`.
 * 10. Konvensi Membentuk Nama Baru (untuk menambah kamus):
 *    - camelCase, tanpa akhiran `In`, `Out`, `Id`, atau garis bawah, kecuali aturan pasangan di bawah.
 *    - Referensi entitas memakai pola `<peran>Entity` (`targetEntity`, `selfEntity`),
 *      bukan `<peran>Id`. Koleksi entitas memakai bentuk jamak (`childEntities`).
 *    - Nilai per sumbu memakai `<nama>X` / `<nama>Y` (`velocityX`, `deltaX`).
 *      `x` dan `y` polos hanya untuk posisi.
 *    - Exec output non-utama memakai `on<Peristiwa>`. Boolean status memakai `is<Kondisi>`
 *      atau `has<Objek>`. Boolean pengaturan input memakai `use<Fitur>`.
 *    - Jika satu node punya input dan output dengan nama dasar yang sama, output diberi
 *      akhiran `Out` (`list` -> `listOut`, `value` -> `valueOut`).
 *    - Node data murni dengan satu hasil utama memakai `result`.
 * 11. Beda `completed` dan `onComplete`:
 *    - `completed`: alur utama node selesai (loop, delay). Tidak ada `execOut` terpisah.
 *    - `onComplete`: callback asynchronous setelah aksi selesai (animasi, tween, fade,
 *      typewriter). `execOut` tetap berjalan langsung.
 * 12. Port Dinamis Kustom:
 *    - `sequential`: `v0`, `v1`, ... (data maupun execution).
 *    - `inputProperty` / `outputProperty`: ID port = `propertyOptions[].value`, camelCase
 *      dan tidak boleh sama dengan port tetap pada node yang sama.
 *    - Else-If: input `condition`, `condition1`..`conditionN`; output `onTrue`,
 *      `onElseIf1`..`onElseIfN`, `onElse`, `onFalse`.
 *    - Switch: input `value`, `case0`..`caseN`; output `onCase0`..`onCaseN`, `onDefault`.
 *    - Keyboard: input `action`, `key0`..`keyN`; output `onKey0`..`onKeyN`.
 *    - Batch: `targetEntity0`..`targetEntityN` dan `value0`..`valueN`.
 * 13. Referensi ID Port di Luar inputs/outputs:
 *    - Pemanggilan alur (`context.triggerFlow('execOut')`, `executeFlow(id, 'onComplete')`),
 *      key `data.values`, dan key `data.options` memakai ID baku yang sama.
 *    - Format string yang membaca ID port sebagai placeholder mengikuti ID baku (`{v0}`).
 * 14. Warna Port Baku per dataType:
 *    - execution `#FFFFFF`, string `#F48FB1`, number `#64B5F6`, boolean `#E57373`,
 *      any `#B0BEC5`, list `#4DD0E1`, map `#FF8A65`.
 * ============================================================================
 */

export const BlueprintCategoryTemplate = {
  id: 'categoryTemplate',
  label: 'Category Name',
  color: '#3B82F6',
  icon: Boxes,

  items: [
    // ------------------------------------------------------------------------
    // TIPE A: EVENT NODE
    // ------------------------------------------------------------------------
    {
      type: 'eventExampleNode',
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
            id: 'execOut',
            dataType: 'execution',
            color: '#FFFFFF'
          },
          {
            id: 'eventData',
            dataType: 'string',
            color: '#F48FB1'
          }
        ],

        data: {
          code: 
`const eventData = context.state.dataValue;

outputs.eventData = eventData;
outputs.execOut = true;
return;`
        }
      }
    },

    // ------------------------------------------------------------------------
    // TIPE B: ACTION NODE
    // ------------------------------------------------------------------------
    {
      type: 'actionExampleNode',
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
            id: 'execIn',
            dataType: 'execution',
            color: '#FFFFFF'
          },
          {
            id: 'targetEntity',
            dataType: 'string',
            color: '#F48FB1',
            defaultValue: 'self'
          },
          {
            id: 'amount',
            dataType: 'number',
            color: '#64B5F6',
            defaultValue: 100
          }
        ],

        outputs: [
          {
            id: 'execOut',
            dataType: 'execution',
            color: '#FFFFFF'
          },
          {
            id: 'result',
            dataType: 'boolean',
            color: '#E57373'
          }
        ],

        data: {
          values: {
            targetEntity: 'self',
            amount: 100
          },

          code: 
`const target = inputs.targetEntity;
const amount = inputs.amount;
const entity = context.assert.exists(context.entity.get(target));

entity.applyAmount(amount);

outputs.result = true;
outputs.execOut = true;
return;`
        }
      }
    },

    // ------------------------------------------------------------------------
    // TYPE C: SEQUENTIAL DYNAMIC NODE
    // ------------------------------------------------------------------------
    {
      type: 'dynamicSequentialNode',
      label: 'Sequential Collection',
      description: 'Automatically adds/removes sequential ports (v0, v1, ...).',
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
            dataType: 'number',
            color: '#64B5F6'
          },
          {
            id: 'v1',
            dataType: 'number',
            color: '#64B5F6'
          }
        ],

        outputs: [
          {
            id: 'result',
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
`const numbers = Object.values(inputs);
outputs.result = numbers.reduce((acc, curr) => acc + curr, 0);
return;`
        }
      }
    },

    // ------------------------------------------------------------------------
    // TYPE D: INPUT PROPERTY DYNAMIC NODE
    // ------------------------------------------------------------------------
    {
      type: 'dynamicSetPropertyNode',
      label: 'Set Entity Property',
      description: 'Dynamically adds input ports based on property options.',
      dynamicMode: 'inputProperty',

      defaultData: {
        settings: {
          headerTitle: 'Set Property',
          headerColor: '#2E7D32',
          category: 'Category Name'
        },

        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],

        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],

        data: {
          values: { targetEntity: 'self' },
          propertyOptions: [
            { value: 'speed', label: 'Move Speed', type: 'number', color: '#64B5F6' },
            { value: 'health', label: 'Health', type: 'number', color: '#64B5F6' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' }
          ],

          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));

entity.speed = inputs.speed;
entity.health = inputs.health;
entity.visible = inputs.visible;

outputs.execOut = true;
return;`
        }
      }
    },

    // ------------------------------------------------------------------------
    // TYPE E: OUTPUT PROPERTY DYNAMIC NODE
    // ------------------------------------------------------------------------
    {
      type: 'dynamicGetPropertyNode',
      label: 'Get Entity Property',
      description: 'Dynamically adds output ports based on property options.',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Get Property',
          headerColor: '#2E7D32',
          category: 'Category Name'
        },

        inputs: [
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],

        outputs: [],

        data: {
          values: { targetEntity: 'self' },
          propertyOptions: [
            { value: 'speed', label: 'Move Speed', type: 'number', color: '#64B5F6' },
            { value: 'health', label: 'Health', type: 'number', color: '#64B5F6' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' }
          ],

          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));

outputs.speed = entity.speed;
outputs.health = entity.health;
outputs.visible = entity.visible;
return;`
        }
      }
    },

    // ------------------------------------------------------------------------
    // TYPE F: PURE DATA NODE (WITHOUT EXECUTION PORT)
    // ------------------------------------------------------------------------
    {
      type: 'pureDataNode',
      label: 'Negate Number',
      description: 'Pure data node without execution ports; result is evaluated on read.',
      dynamicMode: 'none',

      defaultData: {
        settings: {
          headerTitle: 'Negate',
          headerColor: '#009688',
          category: 'Category Name'
        },

        inputs: [
          {
            id: 'a',
            dataType: 'number',
            color: '#64B5F6',
            defaultValue: 0
          }
        ],

        outputs: [
          {
            id: 'result',
            dataType: 'number',
            color: '#64B5F6'
          }
        ],

        data: {
          values: {
            a: 0
          },

          code: 
`const a = inputs.a;

outputs.result = -a;
return;`
        }
      }
    },

    // ------------------------------------------------------------------------
    // TYPE G: BRANCH NODE (MULTIPLE OUT EXECUTION PORTS)
    // ------------------------------------------------------------------------
    {
      type: 'branchExampleNode',
      label: 'Branch',
      description: 'Selects an execution flow based on a boolean condition.',
      dynamicMode: 'none',

      defaultData: {
        settings: {
          headerTitle: 'Branch',
          headerColor: '#3F51B5',
          category: 'Category Name'
        },

        inputs: [
          {
            id: 'execIn',
            dataType: 'execution',
            color: '#FFFFFF'
          },
          {
            id: 'condition',
            dataType: 'boolean',
            color: '#E57373',
            defaultValue: false
          }
        ],

        outputs: [
          {
            id: 'onTrue',
            dataType: 'execution',
            color: '#FFFFFF'
          },
          {
            id: 'onFalse',
            dataType: 'execution',
            color: '#FFFFFF'
          }
        ],

        data: {
          values: {
            condition: false
          },

          code: 
`const condition = inputs.condition;

outputs.onTrue = condition;
outputs.onFalse = !condition;
return;`
        }
      }
    }
  ]
};
