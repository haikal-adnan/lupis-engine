import { Volume2 } from 'lucide-vue-next';

export const BlueprintAudio = {
  id: 'category_audio',
  label: 'Audio',
  color: '#06B6D4',
  icon: Volume2,
  items: [
    {
      type: 'playAudio',
      label: 'Play Audio',
      description: 'Plays audio on the specified entity with an Audio component.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Play Audio',
          headerColor: '#06B6D4',
          category: 'Audio'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self'
          },
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Entity not found');
context.assert.hasComponent(entity, 'Audio', 'Entity does not have Audio component');
context.audio.play(entity);
outputs.execOut = true;
return;`
        }
      }
    },

    {
      type: 'stopAudio',
      label: 'Stop Audio',
      description: 'Stops audio playback on the specified entity.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Stop Audio',
          headerColor: '#06B6D4',
          category: 'Audio'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self'
          },
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Entity not found');
context.audio.stop(entity);
outputs.execOut = true;
return;`
        }
      }
    },

    {
      type: 'setAudioVolume',
      label: 'Set Volume',
      description: 'Sets volume for an audio channel (master, background, sfx, or voice).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set Volume',
          headerColor: '#06B6D4',
          category: 'Audio'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'audioType', dataType: 'string', color: '#F48FB1', defaultValue: 'master' },
          { id: 'volume', dataType: 'number', color: '#64B5F6', defaultValue: 1 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            audioType: 'master',
            volume: 1
          },
          code: 
`const channel = context.assert.isString(inputs.audioType, 'Audio channel must be string');
const vol = context.assert.isNumber(inputs.volume, 'Volume must be number');
context.audio.setVolume(channel, vol);
outputs.execOut = true;
return;`
        }
      }
    },

    {
      type: 'getAudioVolume',
      label: 'Get Volume',
      description: 'Retrieves current volume of an audio channel (master, background, sfx, or voice).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get Volume',
          headerColor: '#06B6D4',
          category: 'Audio'
        },
        inputs: [
          { id: 'audioType', dataType: 'string', color: '#F48FB1', defaultValue: 'master' }
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            audioType: 'master'
          },
          code: 
`const channel = context.assert.isString(inputs.audioType, 'Audio channel must be string');
outputs.result = context.audio.getVolume(channel);
return;`
        }
      }
    },

    {
      type: 'setMasterVolume',
      label: 'Set Master Volume',
      description: 'Sets the master volume controlling all audio channels.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set Master Volume',
          headerColor: '#06B6D4',
          category: 'Audio'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'volume', dataType: 'number', color: '#64B5F6', defaultValue: 1 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            volume: 1
          },
          code: 
`const vol = context.assert.isNumber(inputs.volume, 'Volume must be number');
context.audio.setMasterVolume(vol);
outputs.execOut = true;
return;`
        }
      }
    },

    {
      type: 'setBackgroundVolume',
      label: 'Set Background Volume',
      description: 'Sets the volume for the background music channel.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set Background Volume',
          headerColor: '#06B6D4',
          category: 'Audio'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'volume', dataType: 'number', color: '#64B5F6', defaultValue: 1 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            volume: 1
          },
          code: 
`const vol = context.assert.isNumber(inputs.volume, 'Volume must be number');
context.audio.setBackgroundVolume(vol);
outputs.execOut = true;
return;`
        }
      }
    },

    {
      type: 'setSfxVolume',
      label: 'Set SFX Volume',
      description: 'Sets the volume for the sound effect channel.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set SFX Volume',
          headerColor: '#06B6D4',
          category: 'Audio'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'volume', dataType: 'number', color: '#64B5F6', defaultValue: 1 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            volume: 1
          },
          code: 
`const vol = context.assert.isNumber(inputs.volume, 'Volume must be number');
context.audio.setSfxVolume(vol);
outputs.execOut = true;
return;`
        }
      }
    },

    {
      type: 'setVoiceVolume',
      label: 'Set Voice Volume',
      description: 'Sets the volume for the voice and dialogue channel.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set Voice Volume',
          headerColor: '#06B6D4',
          category: 'Audio'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'volume', dataType: 'number', color: '#64B5F6', defaultValue: 1 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            volume: 1
          },
          code: 
`const vol = context.assert.isNumber(inputs.volume, 'Volume must be number');
context.audio.setVoiceVolume(vol);
outputs.execOut = true;
return;`
        }
      }
    },

    {
      type: 'setAudioMute',
      label: 'Set Channel Mute',
      description: 'Mutes or unmutes a specific audio channel (master, background, sfx, or voice).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set Channel Mute',
          headerColor: '#06B6D4',
          category: 'Audio'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'audioType', dataType: 'string', color: '#F48FB1', defaultValue: 'master' },
          { id: 'isMute', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            audioType: 'master',
            isMute: true
          },
          code: 
`const channel = context.assert.isString(inputs.audioType, 'Audio channel must be string');
const mute = context.assert.isBoolean(inputs.isMute, 'isMute must be boolean');
context.audio.setMute(channel, mute);
outputs.execOut = true;
return;`
        }
      }
    }
  ]
};
