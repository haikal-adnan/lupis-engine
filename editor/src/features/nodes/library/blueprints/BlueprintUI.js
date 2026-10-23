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
`const config = inputs.config;
const cfg = config || (node.data && node.data.values && node.data.values.config) || false;
const ui = context.ui;
if (ui) {
  const res = ui.processVolumeSliders(context.state, cfg, inputs, outputs, context);
  outputs.changedChannel = res.changedChannel;
  outputs.currentVolume = res.currentVolume;
  outputs.masterVolume = res.masterVolume;
  outputs.vocalVolume = res.vocalVolume;
  outputs.sfxVolume = res.sfxVolume;
  outputs.backgroundVolume = res.backgroundVolume;
  outputs.onChanged = res.onChanged;
}
outputs.execOut = true;
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
`const barEntity = inputs.barEntity;
const handlerEntity = inputs.handlerEntity;
const value = inputs.value;
const min = inputs.min;
const max = inputs.max;
const step = inputs.step;
const isInteractive = inputs.isInteractive;
const reverse = inputs.reverse;
const ui = context.ui;
if (ui) {
  const res = ui.processAtomicSlider(context.state, inputs, outputs, context);
  outputs.value = res.value;
  outputs.normalized = res.normalized;
  outputs.onChanged = res.onChanged;
}
outputs.execOut = true;
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
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 0.15 },
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
`const knobEntity = inputs.knobEntity;
const trackEntity = inputs.trackEntity;
const onTextEntity = inputs.onTextEntity;
const offTextEntity = inputs.offTextEntity;
const textEntity = inputs.textEntity;
const isOn = inputs.isOn;
const duration = inputs.duration;
const slideDist = inputs.slideDist;
const knobOnColor = inputs.knobOnColor;
const knobOffColor = inputs.knobOffColor;
const trackOnColor = inputs.trackOnColor;
const trackOffColor = inputs.trackOffColor;
const onText = inputs.onText;
const offText = inputs.offText;
const onTextColor = inputs.onTextColor;
const offTextColor = inputs.offTextColor;

const ui = context.ui;
if (ui) {
  const res = ui.processSwitchButton(context.state, inputs, outputs, false, context);
  outputs.isOn = res.isOn;
  outputs.onOn = res.onOn;
  outputs.onOff = res.onOff;
}
outputs.execOut = true;
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
          { id: 'duration', dataType: 'number', color: '#64B5F6', defaultValue: 0.15 },
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
`const knobEntity = inputs.knobEntity;
const trackEntity = inputs.trackEntity;
const onTextEntity = inputs.onTextEntity;
const offTextEntity = inputs.offTextEntity;
const textEntity = inputs.textEntity;
const isOn = inputs.isOn;
const duration = inputs.duration;
const slideDist = inputs.slideDist;
const knobOnImage = inputs.knobOnImage;
const knobOffImage = inputs.knobOffImage;
const trackOnImage = inputs.trackOnImage;
const trackOffImage = inputs.trackOffImage;
const onText = inputs.onText;
const offText = inputs.offText;
const onTextColor = inputs.onTextColor;
const offTextColor = inputs.offTextColor;

const ui = context.ui;
if (ui) {
  const res = ui.processSwitchButton(context.state, inputs, outputs, true, context);
  outputs.isOn = res.isOn;
  outputs.onOn = res.onOn;
  outputs.onOff = res.onOff;
}
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'uiGridSpawner',
      label: 'UI Grid Spawner',
      description: 'Spawns and positions entity prefabs into a 2D grid layout with per-item callback flow.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'UI Grid Spawner',
          headerColor: '#00ACC1',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'prefabName', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'totalCount', dataType: 'number', color: '#64B5F6', defaultValue: 15 },
          { id: 'columns', dataType: 'number', color: '#64B5F6', defaultValue: 5 },
          { id: 'spacingX', dataType: 'number', color: '#64B5F6', defaultValue: 120 },
          { id: 'spacingY', dataType: 'number', color: '#64B5F6', defaultValue: 120 },
          { id: 'startX', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'startY', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'parentEntity', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'layerId', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'dataList', dataType: 'list', color: '#4DD0E1' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onSpawnItem', dataType: 'execution', color: '#FFFFFF' },
          { id: 'spawnedEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'itemIndex', dataType: 'number', color: '#64B5F6' },
          { id: 'rowIndex', dataType: 'number', color: '#64B5F6' },
          { id: 'colIndex', dataType: 'number', color: '#64B5F6' },
          { id: 'itemData', dataType: 'any', color: '#B0BEC5' },
          { id: 'spawnedEntities', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          values: {
            prefabName: '',
            totalCount: 15,
            columns: 5,
            spacingX: 120,
            spacingY: 120,
            startX: 0,
            startY: 0,
            parentEntity: '',
            layerId: '',
            dataList: []
          },
          code:
`const prefabName = inputs.prefabName;
const totalCount = inputs.totalCount;
const columns = inputs.columns;
const spacingX = inputs.spacingX;
const spacingY = inputs.spacingY;
const startX = inputs.startX;
const startY = inputs.startY;
const parentEntity = inputs.parentEntity;
const layerId = inputs.layerId;
const dataList = inputs.dataList;

const ui = context.ui;
if (ui) {
  const res = ui.processGridSpawner(context.state, inputs, outputs, context);
  outputs.spawnedEntity = res.spawnedEntity;
  outputs.itemIndex = res.itemIndex;
  outputs.rowIndex = res.rowIndex;
  outputs.colIndex = res.colIndex;
  outputs.itemData = res.itemData;
  outputs.spawnedEntities = res.spawnedEntities;
  outputs.onSpawnItem = res.onSpawnItem;
}
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'uiPrefabBinder',
      label: 'UI Prefab Data Binder',
      description: 'God node untuk otomatisasi hidrasi child entity & komponen (Sprite, Text, Transform, Audio, Collider, Physics, Animator, Shape, Tilemap, Script) pada prefab berdasarkan item data / collection.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'UI Prefab Binder',
          headerColor: '#00ACC1',
          category: 'Helper & Tool'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'data', dataType: 'any', color: '#B0BEC5' },
          { id: 'itemIndex', dataType: 'number', color: '#64B5F6' },
          { id: 'bindings', dataType: 'list', color: '#4DD0E1' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'boundCount', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            data: null,
            itemIndex: 0,
            bindings: []
          },
          code:
`const targetEntity = inputs.targetEntity;
const data = inputs.data;
const itemIndex = inputs.itemIndex;
const bindings = inputs.bindings;

const ui = context.ui;
if (ui && typeof ui.processPrefabBinder === 'function') {
  const res = ui.processPrefabBinder(context.state, inputs, outputs, context);
  outputs.targetEntity = res.targetEntity;
  outputs.boundCount = res.boundCount;
}
outputs.execOut = true;
return;`
        }
      }
    }
  ]
};
