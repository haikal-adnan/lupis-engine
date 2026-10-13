import { Zap, Move, HelpCircle, CornerDownLeft } from 'lucide-vue-next';

export const BlueprintKeyboard = {
  id: 'keyboard_events',
  label: 'Keyboard Events',
  color: '#E91E63',
  icon: Zap,
  items: [
    /**
     * =========================================================================
     * 1. EVENT: ON KEY EVENT (Multi-Key Event Listener)
     * =========================================================================
     * 
     * CARA PENGGUNAAN:
     * - Masukkan daftar tombol pada input 'Keys' dipisahkan koma (contoh: "w, s, space, , , shift").
     * - Pilih mode pemicu pada dropdown 'Action':
     *   - 'pressed'  : Memicu flow 1x tepat saat tombol mulai ditekan (Just Down).
     *   - 'released' : Memicu flow 1x tepat saat tombol dilepas (Just Up).
     *   - 'hold'     : Memicu flow secara terus-menerus setiap frame selama tombol ditahan.
     * - Output port akan disinkronkan secara otomatis oleh Inspector sesuai urutan tombol.
     * 
     * CARA KERJA & EKSEKUSI:
     * - Mendaftarkan listener `onTick` ke runtime runner.
     * - Memecah (parse) string input 'keys' dengan dukungan deteksi tombol koma (,,).
     * - Memeriksa status input keyboard pada instance `game.input.keyboard` di setiap tick frame.
     * - Mengaktifkan flow eksekusi (`context.triggerFlow`) pada port output yang sesuai dengan key yang aktif.
     */
    { 
      type: 'event_on_key', 
      label: 'On Key Event', 
      description: 'Triggers individual execution outputs automatically synced with configured key strings.',
      icon: Zap,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'On Key Event', headerColor: '#C2185B', category: 'Keyboard Events' },
        inputs: [
          { id: 'keys', label: 'Keys', dataType: 'string', color: '#FFEB3B', defaultValue: 'a, space' },
          { id: 'action', label: 'Action', dataType: 'string', color: '#FFEB3B', defaultValue: 'pressed' }
        ],
        outputs: [
          { id: 'out_a', label: 'a', dataType: 'execution', color: '#ffffff' },
          { id: 'out_space', label: 'space', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          values: {
            action: 'pressed'
          },
          options: {
            action: [
              { label: 'Pressed (Just Down)', value: 'pressed' },
              { label: 'Released (Just Up)', value: 'released' },
              { label: 'Hold (Is Down)', value: 'hold' }
            ]
          },
          code: `context.onTick(() => {
  const keyboard = context.game?.input?.keyboard;
  if (!keyboard) return;

  const rawKeys = inputs.keys || '';
  const action = (inputs.action || 'pressed').toLowerCase();

  const rawTokens = rawKeys.split(',').map(t => t.trim().toLowerCase());
  const parsedKeys = [];

  let i = 0;
  while (i < rawTokens.length) {
    const token = rawTokens[i];
    if (token.length > 0) {
      parsedKeys.push(token);
      i++;
    } else {
      if (i + 1 < rawTokens.length && rawTokens[i + 1] === '') {
        parsedKeys.push(',');
        i += 2;
      } else {
        i++;
      }
    }
  }

  const activeOutputs = node.outputs || [];

  activeOutputs.forEach((output, index) => {
    let keyName = parsedKeys[index] || output.label || output.id.replace(/^out_/, '');
    keyName = keyName.trim().toLowerCase();

    if (!keyName) return;

    let triggered = false;

    if (action === 'pressed' && keyboard.isPressed(keyName)) {
      triggered = true;
    } else if (action === 'released' && keyboard.isReleased(keyName)) {
      triggered = true;
    } else if (action === 'hold' && keyboard.isDown(keyName)) {
      triggered = true;
    }

    if (triggered) {
      context.triggerFlow(output.id);
    }
  });
});
return;`
        }
      } 
    },

    /**
     * =========================================================================
     * 2. GETTER: GET KEY STATE (Pure Data Getter)
     * =========================================================================
     * 
     * CARA PENGGUNAAN:
     * - Hubungkan output data `isDown` (boolean) ke node logika seperti `Branch / If` atau `Set Variable`.
     * - Masukkan string tombol yang ingin diperiksa pada input 'Key' (contoh: "space", "shift", "a").
     * - Node ini bersifat pure data getter (tanpa input execution flow).
     * 
     * CARA KERJA & EKSEKUSI:
     * - Dievaluasi secara live (on-demand) setiap kali nilainya dibaca oleh node lain.
     * - Membaca status instan dari `keyboard.isDown(key)` pada frame aktif.
     * - Mengembalikan nilai boolean (`true` jika ditekan, `false` jika tidak).
     */
    { 
      type: 'get_key_state', 
      label: 'Get Key State', 
      description: 'Returns true if the specified key is currently held down.',
      icon: HelpCircle,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Get Key State', headerColor: '#C2185B', category: 'Keyboard Events' },
        inputs: [
          { id: 'key', label: 'Key', dataType: 'string', color: '#FFEB3B', defaultValue: 'space' }
        ], 
        outputs: [
          { id: 'isDown', label: 'Is Down', dataType: 'boolean', color: '#f472b6' }
        ],
        data: {
          code: `const key = inputs.key;
const keyboard = context.game?.input?.keyboard;
const formattedKey = key === ' ' ? 'space' : (key || '').toLowerCase();

outputs.isDown = (formattedKey && keyboard) ? keyboard.isDown(formattedKey) : false;
return;`
        }
      } 
    },

    /**
     * =========================================================================
     * 3. HELPER: CALCULATE AXIS 2D (2D Vector Movement Helper)
     * =========================================================================
     * 
     * CARA PENGGUNAAN:
     * - Hubungkan masukan alur eksekusi dari node `On Tick` ke port `In (Tick)`.
     * - Tentukan 4 tombol pergerakan pada input 'Up Key', 'Down Key', 'Right Key', dan 'Left Key' (default: W, S, D, A).
     * - Gunakan output angka `Axis X` (-1 s/d 1) dan `Axis Y` (-1 s/d 1) untuk menggerakkan entitas/posisi objek.
     * 
     * CARA KERJA & EKSEKUSI:
     * - Berjalan saat menerima pancaran eksekusi tick.
     * - Menghitung nilai sumbu horizontal (Right=+1, Left=-1) dan vertikal (Up=+1, Down=-1).
     * - Meneruskan eksekusi secara langsung ke output `Out` bersama nilai terhitung pada `Axis X` dan `Axis Y`.
     */
    { 
      type: 'calculate_axis_2d', 
      label: 'Calculate Axis 2D', 
      description: 'Calculates directional X and Y axes based on assigned key strings.',
      icon: Move,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Calc Axis 2D', headerColor: '#C2185B', category: 'Keyboard Events' },
        inputs: [
          { id: 'exec_tick', label: 'In (Tick)', dataType: 'execution', color: '#ffffff' },
          { id: 'upKey', label: 'Up Key', dataType: 'string', color: '#FFEB3B', defaultValue: 'w' },
          { id: 'downKey', label: 'Down Key', dataType: 'string', color: '#FFEB3B', defaultValue: 's' },
          { id: 'rightKey', label: 'Right Key', dataType: 'string', color: '#FFEB3B', defaultValue: 'd' },
          { id: 'leftKey', label: 'Left Key', dataType: 'string', color: '#FFEB3B', defaultValue: 'a' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { id: 'axis_x', label: 'Axis X', dataType: 'number', color: '#B2FF59' },
          { id: 'axis_y', label: 'Axis Y', dataType: 'number', color: '#B2FF59' }
        ],
        data: {
          code: `const keyboard = context.game?.input?.keyboard;
const upKey = inputs.upKey;
const downKey = inputs.downKey;
const rightKey = inputs.rightKey;
const leftKey = inputs.leftKey;

let x = 0;
let y = 0;

if (keyboard) {
  if (rightKey && keyboard.isDown(rightKey.toLowerCase())) x += 1;
  if (leftKey && keyboard.isDown(leftKey.toLowerCase())) x -= 1;
  if (upKey && keyboard.isDown(upKey.toLowerCase())) y += 1;
  if (downKey && keyboard.isDown(downKey.toLowerCase())) y -= 1;
}

outputs.axis_x = x;
outputs.axis_y = y;
outputs.exec_out = true;
return;`
        }
      } 
    },

    /**
     * =========================================================================
     * 4. UTILITY: SIMULATE KEY (Synthetic Input Dispatched)
     * =========================================================================
     * 
     * CARA PENGGUNAAN:
     * - Dipicu lewat aliran eksekusi pada port `In` (misalnya saat tombol UI / Virtual Pad diklik).
     * - Tentukan tombol yang ingin disimulasikan pada input 'Key' dan statusnya pada 'Is Down' (true = keydown, false = keyup).
     * 
     * CARA KERJA & EKSEKUSI:
     * - Membuat objek sintesis `KeyboardEvent` standar DOM ('keydown' atau 'keyup').
     * - Memancarkan (*dispatch*) event tersebut ke `window` serta elemen Canvas game aktif.
     * - Memungkinkan event handler bawaan engine menangkap input tersebut seolah-olah tombol fisik ditekan.
     */
    { 
      type: 'simulate_key', 
      label: 'Simulate Key', 
      description: 'Dispatches synthetic keyboard events for UI interaction or virtual pads.',
      icon: CornerDownLeft,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Simulate Key', headerColor: '#C2185B', category: 'Keyboard Events' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'key', label: 'Key', dataType: 'string', color: '#FFEB3B', defaultValue: 'd' },
          { id: 'isDown', label: 'Is Down', dataType: 'boolean', color: '#f472b6', defaultValue: true }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          code: `const key = inputs.key;
const isDown = inputs.isDown;

if (key) {
  const eventType = isDown ? 'keydown' : 'keyup';
  const formattedKey = key === ' ' ? 'space' : key;
  const keyCode = formattedKey.toUpperCase().charCodeAt(0);
  
  const event = new KeyboardEvent(eventType, {
    key: formattedKey,
    code: \`Key\${formattedKey.toUpperCase()}\`,
    keyCode: keyCode,
    which: keyCode,
    bubbles: true,
    cancelable: true
  });
  
  window.dispatchEvent(event);
  if (context.game && context.game.canvas) {
    context.game.canvas.dispatchEvent(event);
  }
}

outputs.exec_out = true;
return;`
        }
      } 
    }
  ]
};