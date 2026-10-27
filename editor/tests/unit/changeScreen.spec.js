import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Game from '@core/Core/Game.js';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import { BlueprintLifecycle } from '@nodes/library/blueprints/BlueprintLifecycle.js';
import { validateCodePanelContract } from '@nodes/nodes.js';

describe('Change Screen Node & System Tests', () => {
  const changeScreenDef = BlueprintLifecycle.items.find(i => i.type === 'changeScreen');

  describe('1. Blueprint Definition & Metadata', () => {
    it('defines changeScreen in BlueprintLifecycle with correct ports and options', () => {
      expect(changeScreenDef).toBeDefined();
      expect(changeScreenDef.label).toBe('Change Screen');
      expect(changeScreenDef.defaultData.settings.headerTitle).toBe('Change Screen');
      expect(changeScreenDef.defaultData.settings.category).toBe('Scene & Lifecycle');

      // Check inputs: execIn and mode dropdown
      const inputIds = changeScreenDef.defaultData.inputs.map(i => i.id);
      expect(inputIds).toContain('execIn');
      expect(inputIds).toContain('mode');

      const modeInput = changeScreenDef.defaultData.inputs.find(i => i.id === 'mode');
      expect(modeInput.dataType).toBe('string');
      expect(modeInput.defaultValue).toBe('window');

      // Check options
      const modeOptions = changeScreenDef.defaultData.data.options.mode;
      expect(modeOptions).toEqual([
        { label: 'Window', value: 'window' },
        { label: 'Full Screen', value: 'fullscreen' }
      ]);

      // Check outputs: execOut only
      const outputIds = changeScreenDef.defaultData.outputs.map(o => o.id);
      expect(outputIds).toEqual(['execOut']);
      expect(changeScreenDef.defaultData.outputs[0].dataType).toBe('execution');
    });

    it('passes codePanelContract validation', () => {
      const validation = validateCodePanelContract(changeScreenDef.defaultData.data.code, {
        node: {
          inputs: changeScreenDef.defaultData.inputs,
          outputs: changeScreenDef.defaultData.outputs
        }
      });

      expect(validation.isValid, `Validation failed: ${validation.issues.join(', ')}`).toBe(true);
      expect(validation.hasSyntaxError).toBe(false);
      expect(validation.usedInputsCount).toBe(1); // mode
      expect(validation.usedOutputsCount).toBe(1); // execOut
    });
  });

  describe('2. Game.prototype.changeScreen & Context Lifecycle Facade', () => {
    let game;

    beforeEach(() => {
      game = new Game();
    });

    afterEach(() => {
      if (game) game.destroy();
      delete window.electronAPI;
    });

    it('exposes changeScreen and setScreenMode on context.lifecycle', () => {
      const runner = {
        owner: { id: 'ent_test' },
        _isScriptActive: () => true,
        _registeredEvents: []
      };
      const node = { id: 'node_screen_1' };
      const context = game.contextSystem.createExecutionContext(runner, node);

      expect(context.lifecycle.changeScreen).toBeDefined();
      expect(typeof context.lifecycle.changeScreen).toBe('function');
      expect(context.lifecycle.setScreenMode).toBeDefined();

      const gameChangeSpy = vi.spyOn(game, 'changeScreen');
      context.lifecycle.changeScreen('fullscreen');
      expect(gameChangeSpy).toHaveBeenCalledWith('fullscreen');
    });

    it('emits screen:change event with correct payload', () => {
      const eventSpy = vi.fn();
      game.events.on('screen:change', eventSpy);

      game.changeScreen('fullscreen');
      expect(eventSpy).toHaveBeenCalledWith({ mode: 'fullscreen' });

      game.changeScreen('window');
      expect(eventSpy).toHaveBeenCalledWith({ mode: 'window' });
    });

    it('handles web browser Fullscreen API in web mode', () => {
      const requestFullscreenMock = vi.fn(() => Promise.resolve());
      const exitFullscreenMock = vi.fn(() => Promise.resolve());

      document.documentElement.requestFullscreen = requestFullscreenMock;
      document.exitFullscreen = exitFullscreenMock;

      // Enter fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        configurable: true
      });
      game.changeScreen('fullscreen');
      expect(requestFullscreenMock).toHaveBeenCalled();

      // Exit fullscreen (simulate fullscreenElement is active)
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.documentElement,
        configurable: true
      });
      game.changeScreen('window');
      expect(exitFullscreenMock).toHaveBeenCalled();
    });

    it('routes to window.electronAPI.changeScreen in Electron environment', () => {
      const mockChangeScreen = vi.fn();
      window.electronAPI = {
        changeScreen: mockChangeScreen
      };

      game.changeScreen('fullscreen');
      expect(mockChangeScreen).toHaveBeenCalledWith('fullscreen');

      game.changeScreen('window');
      expect(mockChangeScreen).toHaveBeenCalledWith('window');
    });

    it('routes to window.electronAPI.setFullScreen fallback in Electron environment', () => {
      const mockSetFullScreen = vi.fn();
      window.electronAPI = {
        setFullScreen: mockSetFullScreen
      };

      game.changeScreen('fullscreen');
      expect(mockSetFullScreen).toHaveBeenCalledWith(true);

      game.changeScreen('window');
      expect(mockSetFullScreen).toHaveBeenCalledWith(false);
    });
  });

  describe('3. ScriptRunner Node Execution', () => {
    let game;

    beforeEach(() => {
      game = new Game();
    });

    afterEach(() => {
      if (game) game.destroy();
      delete window.electronAPI;
    });

    it('executes changeScreen node with fullscreen mode and activates execOut', () => {
      const changeSpy = vi.spyOn(game, 'changeScreen');

      const scriptData = {
        id: 'script_screen_test',
        nodes: [
          {
            id: 'node_change_screen',
            type: 'changeScreen',
            inputs: changeScreenDef.defaultData.inputs,
            outputs: changeScreenDef.defaultData.outputs,
            data: {
              values: {
                mode: 'fullscreen'
              },
              options: changeScreenDef.defaultData.data.options,
              code: changeScreenDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(game, scriptData);
      const flowSpy = vi.spyOn(runner, 'executeFlow');
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      expect(changeSpy).toHaveBeenCalledWith('fullscreen');
      expect(flowSpy).toHaveBeenCalledWith('node_change_screen', 'execOut');
    });

    it('executes changeScreen node with window mode and activates execOut', () => {
      const changeSpy = vi.spyOn(game, 'changeScreen');

      const scriptData = {
        id: 'script_screen_test_window',
        nodes: [
          {
            id: 'node_change_screen_win',
            type: 'changeScreen',
            inputs: changeScreenDef.defaultData.inputs,
            outputs: changeScreenDef.defaultData.outputs,
            data: {
              values: {
                mode: 'window'
              },
              options: changeScreenDef.defaultData.data.options,
              code: changeScreenDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(game, scriptData);
      const flowSpy = vi.spyOn(runner, 'executeFlow');
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      expect(changeSpy).toHaveBeenCalledWith('window');
      expect(flowSpy).toHaveBeenCalledWith('node_change_screen_win', 'execOut');
    });
  });
});
