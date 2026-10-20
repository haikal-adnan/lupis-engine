import { Sliders } from 'lucide-vue-next';

export const BlueprintUI = {
  id: 'ui_tool',
  label: 'UI & Widget',
  color: '#00ACC1',
  icon: Sliders,
  items: [
    {
      type: 'volumeSliderManager',
      label: 'Volume Slider Manager',
      description: 'Unified 4-channel automatic volume slider manager with auto crop & handle positioning.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Volume Slider Manager',
          headerColor: '#00ACC1',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'config', dataType: 'map', color: '#FF8A65' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onChanged', dataType: 'execution', color: '#FFFFFF' },
          { id: 'changedChannel', dataType: 'string', color: '#F48FB1' },
          { id: 'currentVolume', dataType: 'number', color: '#64B5F6' },
          { id: 'masterVolume', dataType: 'number', color: '#64B5F6' },
          { id: 'vocalVolume', dataType: 'number', color: '#64B5F6' },
          { id: 'sfxVolume', dataType: 'number', color: '#64B5F6' },
          { id: 'backgroundVolume', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            config: {
              master: { bar: 'VolumeMasterBar', handler: 'VolumeMasterHandler', indicator: 'VolumeMasterIndicator' },
              vocal: { bar: 'VolumeVocalBar', handler: 'VolumeVocalHandler', indicator: 'VolumeVocalIndicator' },
              sfx: { bar: 'VolumeSFXBar', handler: 'VolumeSFXHandler', indicator: 'VolumeSFXIndicator' },
              background: { bar: 'VolumeBGMBar', handler: 'VolumeBGMHandler', indicator: 'VolumeBGMIndicator' }
            }
          },
          code:
`const cfg = (node.data && node.data.values && node.data.values.config) || false;
let ui = context.ui;
if (!ui && context.game && context.game.contextSystem) {
  ui = context.game.contextSystem.uiHandler;
}
if (ui) {
  ui.processVolumeSliders(context.state, cfg, inputs, outputs, context);
}
return;`
        }
      }
    },
    {
      type: 'atomicSlider',
      label: 'Atomic Slider',
      description: 'Mengatur slider modular berbasis nilai bebas (misal 0-160), mendukung bar shape/sprite, knob independen atau child, pembulatan step, serta arah reverse.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Atomic Slider',
          headerColor: '#00ACC1',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'barEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'handlerEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'value', dataType: 'number', color: '#64B5F6' },
          { id: 'min', dataType: 'number', color: '#64B5F6' },
          { id: 'max', dataType: 'number', color: '#64B5F6' },
          { id: 'step', dataType: 'number', color: '#64B5F6' },
          { id: 'isInteractive', dataType: 'boolean', color: '#81C784' },
          { id: 'reverse', dataType: 'boolean', color: '#81C784' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onChanged', dataType: 'execution', color: '#FFFFFF' },
          { id: 'value', dataType: 'number', color: '#64B5F6' },
          { id: 'normalized', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            barEntity: '',
            handlerEntity: '',
            value: 100,
            min: 0,
            max: 100,
            step: 1,
            isInteractive: true,
            reverse: false
          },
          code:
`let ui = context.ui;
if (!ui && context.game && context.game.contextSystem) {
  ui = context.game.contextSystem.uiHandler;
}
if (ui) {
  ui.processAtomicSlider(context.state, inputs, outputs, context);
}
return;`
        }
      }
    },
    {
      type: 'switchButtonShape',
      label: 'Switch Button Shape',
      description: 'Mengatur interaksi switch toggle berbasis ShapeRenderer dengan animasi geser knob, area klik slide distance, dan dukungan 2 teks (ON/OFF).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Switch Button (Shape)',
          headerColor: '#AB47BC',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'knobEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'trackEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'onTextEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'offTextEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'textEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'isOn', dataType: 'boolean', color: '#81C784' },
          { id: 'duration', dataType: 'number', color: '#64B5F6' },
          { id: 'slideDist', dataType: 'number', color: '#64B5F6' },
          { id: 'knobOnColor', dataType: 'string', color: '#F48FB1' },
          { id: 'knobOffColor', dataType: 'string', color: '#F48FB1' },
          { id: 'trackOnColor', dataType: 'string', color: '#F48FB1' },
          { id: 'trackOffColor', dataType: 'string', color: '#F48FB1' },
          { id: 'onText', dataType: 'string', color: '#F48FB1' },
          { id: 'offText', dataType: 'string', color: '#F48FB1' },
          { id: 'onTextColor', dataType: 'string', color: '#F48FB1' },
          { id: 'offTextColor', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isOn', dataType: 'boolean', color: '#E57373' },
          { id: 'onOn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onOff', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            knobEntity: '',
            trackEntity: '',
            onTextEntity: '',
            offTextEntity: '',
            textEntity: '',
            isOn: false,
            duration: 0.15,
            slideDist: 40,
            knobOnColor: '#FFFFFF',
            knobOffColor: '#E0E0E0',
            trackOnColor: '#4CAF50',
            trackOffColor: '#757575',
            onText: 'ON',
            offText: 'OFF',
            onTextColor: '#FFFFFF',
            offTextColor: '#BDBDBD'
          },
          code:
`let ui = context.ui;
if (!ui && context.game && context.game.contextSystem) {
  ui = context.game.contextSystem.uiHandler;
}
if (ui) {
  ui.processSwitchButton(context.state, inputs, outputs, false, context);
}
return;`
        }
      }
    },
    {
      type: 'switchButtonImage',
      label: 'Switch Button Image',
      description: 'Mengatur interaksi switch toggle berbasis SpriteRenderer dengan animasi geser knob, pergantian gambar ON/OFF, dan area klik interaktif.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Switch Button (Image)',
          headerColor: '#AB47BC',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'knobEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'trackEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'onTextEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'offTextEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'textEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'isOn', dataType: 'boolean', color: '#81C784' },
          { id: 'duration', dataType: 'number', color: '#64B5F6' },
          { id: 'slideDist', dataType: 'number', color: '#64B5F6' },
          { id: 'knobOnImage', dataType: 'string', color: '#F48FB1' },
          { id: 'knobOffImage', dataType: 'string', color: '#F48FB1' },
          { id: 'trackOnImage', dataType: 'string', color: '#F48FB1' },
          { id: 'trackOffImage', dataType: 'string', color: '#F48FB1' },
          { id: 'onText', dataType: 'string', color: '#F48FB1' },
          { id: 'offText', dataType: 'string', color: '#F48FB1' },
          { id: 'onTextColor', dataType: 'string', color: '#F48FB1' },
          { id: 'offTextColor', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isOn', dataType: 'boolean', color: '#E57373' },
          { id: 'onOn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onOff', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            knobEntity: '',
            trackEntity: '',
            onTextEntity: '',
            offTextEntity: '',
            textEntity: '',
            isOn: false,
            duration: 0.15,
            slideDist: 40,
            knobOnImage: '',
            knobOffImage: '',
            trackOnImage: '',
            trackOffImage: '',
            onText: 'ON',
            offText: 'OFF',
            onTextColor: '#FFFFFF',
            offTextColor: '#BDBDBD'
          },
          code:
`let ui = context.ui;
if (!ui && context.game && context.game.contextSystem) {
  ui = context.game.contextSystem.uiHandler;
}
if (ui) {
  ui.processSwitchButton(context.state, inputs, outputs, true, context);
}
return;`
        }
      }
    }
  ]
};
