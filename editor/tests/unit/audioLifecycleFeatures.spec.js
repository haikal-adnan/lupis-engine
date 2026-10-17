import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Game from '@core/Core/Game.js';
import AudioSystem from '@core/System/AudioSystem.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import { componentSchema } from '@scenes/schemas/componentSchema.js';
import { BlueprintLifecycle } from '@nodes/library/blueprints/BlueprintLifecycle.js';
import { BlueprintAudio } from '@nodes/library/blueprints/BlueprintAudio.js';
import { validateCodePanelContract } from '@nodes/contract/codePanelContract.js';

describe('Audio & Lifecycle Features Unit & Integration Tests', () => {
  let game;

  beforeEach(() => {
    game = new Game();
    game.initLoop();
  });

  afterEach(() => {
    if (game) {
      game.destroy();
    }
    vi.restoreAllMocks();
  });

  describe('1. Audio Component Schema & Types', () => {
    it('creates Audio component with default audioType "sfx"', () => {
      const audioComp = componentSchema.create('Audio');
      expect(audioComp.audioType).toBe('sfx');
      expect(audioComp.volume).toBe(1.0);
      expect(audioComp.isMute).toBe(false);
      expect(audioComp.loop).toBe(false);
    });

    it('creates Audio component with background, sfx, or voice audioType', () => {
      const bgmComp = componentSchema.create('Audio', { audioType: 'background' });
      expect(bgmComp.audioType).toBe('background');

      const sfxComp = componentSchema.create('Audio', { audioType: 'sfx' });
      expect(sfxComp.audioType).toBe('sfx');

      const voiceComp = componentSchema.create('Audio', { audioType: 'voice' });
      expect(voiceComp.audioType).toBe('voice');
    });

    it('normalizes invalid or unknown audioType to "sfx"', () => {
      const invalidComp = componentSchema.create('Audio', { audioType: 'unknown_channel' });
      expect(invalidComp.audioType).toBe('sfx');

      const masterComp = componentSchema.create('Audio', { audioType: 'master' });
      // "master" is not selectable by user on entity Audio components, fallback to "sfx"
      expect(masterComp.audioType).toBe('sfx');
    });
  });

  describe('2. AudioSystem 4-Channel Bus Architecture', () => {
    let audioSystem;

    beforeEach(() => {
      audioSystem = new AudioSystem(game);
    });

    it('initializes 4 buses: master, background, sfx, and voice', () => {
      expect(audioSystem.buses).toBeDefined();
      expect(audioSystem.buses.master).toBeDefined();
      expect(audioSystem.buses.background).toBeDefined();
      expect(audioSystem.buses.sfx).toBeDefined();
      expect(audioSystem.buses.voice).toBeDefined();

      expect(audioSystem.getBusGainNode('master')).toBe(audioSystem.masterGain);
      expect(audioSystem.getBusGainNode('background')).toBe(audioSystem.backgroundGain);
      expect(audioSystem.getBusGainNode('sfx')).toBe(audioSystem.sfxGain);
      expect(audioSystem.getBusGainNode('voice')).toBe(audioSystem.voiceGain);
    });

    it('controls volume on each individual bus correctly', () => {
      audioSystem.setVolume('background', 0.6);
      expect(audioSystem.getVolume('background')).toBe(0.6);
      expect(audioSystem.buses.background.gain.gain.value).toBe(0.6);

      audioSystem.setVolume('sfx', 0.75);
      expect(audioSystem.getVolume('sfx')).toBe(0.75);
      expect(audioSystem.buses.sfx.gain.gain.value).toBe(0.75);

      audioSystem.setVolume('voice', 0.9);
      expect(audioSystem.getVolume('voice')).toBe(0.9);
      expect(audioSystem.buses.voice.gain.gain.value).toBe(0.9);

      audioSystem.setVolume('master', 0.5);
      expect(audioSystem.getVolume('master')).toBe(0.5);
      expect(audioSystem.buses.master.gain.gain.value).toBe(0.5);
    });

    it('supports convenience volume setter and getter methods', () => {
      audioSystem.setMasterVolume(0.85);
      expect(audioSystem.getMasterVolume()).toBe(0.85);

      audioSystem.setBackgroundVolume(0.4);
      expect(audioSystem.getBackgroundVolume()).toBe(0.4);

      audioSystem.setSfxVolume(0.65);
      expect(audioSystem.getSfxVolume()).toBe(0.65);

      audioSystem.setVoiceVolume(0.95);
      expect(audioSystem.getVoiceVolume()).toBe(0.95);
    });

    it('handles muting and unmuting per bus without losing volume setting', () => {
      audioSystem.setVolume('sfx', 0.7);
      expect(audioSystem.isMuted('sfx')).toBe(false);

      audioSystem.setMute('sfx', true);
      expect(audioSystem.isMuted('sfx')).toBe(true);
      expect(audioSystem.buses.sfx.gain.gain.value).toBe(0);
      expect(audioSystem.getVolume('sfx')).toBe(0.7);

      audioSystem.setMute('sfx', false);
      expect(audioSystem.isMuted('sfx')).toBe(false);
      expect(audioSystem.buses.sfx.gain.gain.value).toBe(0.7);
    });

    it('routes audio playback to correct bus based on audioType', () => {
      const mockBuffer = {};
      game.world.audios = {
        bgm_asset: mockBuffer,
        sfx_asset: mockBuffer,
        voice_asset: mockBuffer
      };

      const entityBgm = {
        id: 'ent_bgm',
        components: {
          Audio: {
            assetId: 'bgm_asset',
            audioType: 'background',
            volume: 0.8
          }
        }
      };

      const entityVoice = {
        id: 'ent_voice',
        components: {
          Audio: {
            assetId: 'voice_asset',
            audioType: 'voice',
            volume: 0.9
          }
        }
      };

      const entitySfx = {
        id: 'ent_sfx',
        components: {
          Audio: {
            assetId: 'sfx_asset',
            audioType: 'sfx',
            volume: 1.0
          }
        }
      };

      const bgmNodeId = audioSystem.play(entityBgm);
      const voiceNodeId = audioSystem.play(entityVoice);
      const sfxNodeId = audioSystem.play(entitySfx);

      expect(bgmNodeId).toBeDefined();
      expect(voiceNodeId).toBeDefined();
      expect(sfxNodeId).toBeDefined();

      const bgmNode = audioSystem.activeNodes.get(bgmNodeId);
      const voiceNode = audioSystem.activeNodes.get(voiceNodeId);
      const sfxNode = audioSystem.activeNodes.get(sfxNodeId);

      expect(bgmNode.channel).toBe('background');
      expect(voiceNode.channel).toBe('voice');
      expect(sfxNode.channel).toBe('sfx');
    });

    it('plays sound directly and stops all audio nodes', () => {
      const mockBuffer = {};
      const nodeId = audioSystem.playSound(mockBuffer, { audioType: 'voice', volume: 0.8 });
      expect(nodeId).toBeDefined();
      expect(audioSystem.activeNodes.size).toBe(1);

      audioSystem.stopAll();
      expect(audioSystem.activeNodes.size).toBe(0);
    });
  });

  describe('3. Lifecycle Quit & OnQuit Execution', () => {
    it('triggers game:quit event and stops loop on quitGame', () => {
      let quitEventFired = false;
      game.events.on('game:quit', () => {
        quitEventFired = true;
      });

      const stopSpy = vi.spyOn(game.loop, 'stop');

      game.quitGame();

      expect(quitEventFired).toBe(true);
      expect(stopSpy).toHaveBeenCalled();
    });

    it('calls window.electronAPI.quit in Electron build environment', () => {
      const mockQuit = vi.fn();
      window.electronAPI = { quit: mockQuit };

      game.quitGame();

      expect(mockQuit).toHaveBeenCalled();
      delete window.electronAPI;
    });

    it('falls back to window.close in Preview / browser tab environment', () => {
      const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});

      game.quitGame();

      expect(closeSpy).toHaveBeenCalled();
      closeSpy.mockRestore();
    });

    it('triggers context.onGameQuit callback when game quits', () => {
      const runner = {
        owner: { id: 'ent_1' },
        _isScriptActive: () => true,
        _registeredEvents: []
      };
      const node = { id: 'node_quit_1' };
      const context = game.contextSystem.createExecutionContext(runner, node);

      let quitCallbackTriggered = false;
      context.onGameQuit(() => {
        quitCallbackTriggered = true;
      });

      game.quitGame();
      expect(quitCallbackTriggered).toBe(true);
    });

    it('triggers context.onQuit alias callback when game quits', () => {
      const runner = {
        owner: { id: 'ent_1' },
        _isScriptActive: () => true,
        _registeredEvents: []
      };
      const node = { id: 'node_quit_2' };
      const context = game.contextSystem.createExecutionContext(runner, node);

      let quitCallbackTriggered = false;
      context.onQuit(() => {
        quitCallbackTriggered = true;
      });

      context.lifecycle.quit();
      expect(quitCallbackTriggered).toBe(true);
    });
  });

  describe('4. ContextSystem Audio Facade', () => {
    it('provides full audio facade methods on execution context', () => {
      const runner = {
        owner: { id: 'ent_1' },
        _isScriptActive: () => true,
        _registeredEvents: []
      };
      const node = { id: 'node_audio_1' };
      const context = game.contextSystem.createExecutionContext(runner, node);

      expect(context.audio).toBeDefined();
      expect(typeof context.audio.play).toBe('function');
      expect(typeof context.audio.stop).toBe('function');
      expect(typeof context.audio.setVolume).toBe('function');
      expect(typeof context.audio.getVolume).toBe('function');
      expect(typeof context.audio.setMasterVolume).toBe('function');
      expect(typeof context.audio.getMasterVolume).toBe('function');
      expect(typeof context.audio.setBackgroundVolume).toBe('function');
      expect(typeof context.audio.getBackgroundVolume).toBe('function');
      expect(typeof context.audio.setSfxVolume).toBe('function');
      expect(typeof context.audio.getSfxVolume).toBe('function');
      expect(typeof context.audio.setVoiceVolume).toBe('function');
      expect(typeof context.audio.getVoiceVolume).toBe('function');
      expect(typeof context.audio.setMute).toBe('function');
      expect(typeof context.audio.isMuted).toBe('function');

      context.audio.setMasterVolume(0.5);
      expect(context.audio.getMasterVolume()).toBe(0.5);

      context.audio.setBackgroundVolume(0.3);
      expect(context.audio.getBackgroundVolume()).toBe(0.3);

      context.audio.setSfxVolume(0.8);
      expect(context.audio.getSfxVolume()).toBe(0.8);

      context.audio.setVoiceVolume(0.9);
      expect(context.audio.getVoiceVolume()).toBe(0.9);
    });
  });

  describe('5. Blueprint Lifecycle Nodes (eventGameQuit & actionGameQuit)', () => {
    it('defines eventGameQuit and actionGameQuit in BlueprintLifecycle', () => {
      const eventQuit = BlueprintLifecycle.items.find(i => i.type === 'eventGameQuit');
      expect(eventQuit).toBeDefined();
      expect(eventQuit.label).toBe('On Game Quit');
      expect(eventQuit.defaultData.settings.headerTitle).toBe('On Game Quit');
      expect(eventQuit.defaultData.outputs[0].id).toBe('execOut');
      expect(eventQuit.defaultData.data.code).toContain('context.onGameQuit');

      const actionQuit = BlueprintLifecycle.items.find(i => i.type === 'actionGameQuit');
      expect(actionQuit).toBeDefined();
      expect(actionQuit.label).toBe('Quit Game');
      expect(actionQuit.defaultData.settings.headerTitle).toBe('Quit Game');
      expect(actionQuit.defaultData.inputs[0].id).toBe('execIn');
      expect(actionQuit.defaultData.outputs[0].id).toBe('execOut');
      expect(actionQuit.defaultData.data.code).toContain('context.lifecycle.quit()');
    });

    it('passes codePanelContract validation for eventGameQuit and actionGameQuit', () => {
      const eventQuit = BlueprintLifecycle.items.find(i => i.type === 'eventGameQuit');
      const eventValidation = validateCodePanelContract(eventQuit.defaultData.data.code, {
        node: { inputs: eventQuit.defaultData.inputs, outputs: eventQuit.defaultData.outputs }
      });
      expect(eventValidation.isValid).toBe(true);

      const actionQuit = BlueprintLifecycle.items.find(i => i.type === 'actionGameQuit');
      const actionValidation = validateCodePanelContract(actionQuit.defaultData.data.code, {
        node: { inputs: actionQuit.defaultData.inputs, outputs: actionQuit.defaultData.outputs }
      });
      expect(actionValidation.isValid).toBe(true);
    });
  });

  describe('6. Blueprint Audio Module Nodes Validation', () => {
    it('has category_audio with 9 defined blueprint nodes', () => {
      expect(BlueprintAudio.id).toBe('category_audio');
      expect(BlueprintAudio.label).toBe('Audio');
      expect(BlueprintAudio.items).toHaveLength(9);
    });

    it('validates each node in BlueprintAudio with codePanelContract', () => {
      BlueprintAudio.items.forEach(item => {
        const validation = validateCodePanelContract(item.defaultData.data.code, {
          node: {
            inputs: item.defaultData.inputs,
            outputs: item.defaultData.outputs
          }
        });
        expect(validation.isValid, `Node ${item.type} validation failed: ${validation.issues.join(', ')}`).toBe(true);
      });
    });
  });
});
