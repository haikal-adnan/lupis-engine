import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Game from '@core/Core/Game.js';
import Config from '@core/Core/Config.js';
import Keyboard from '@core/Input/Keyboard.js';
import TilemapTool from '@core/Editor/TilemapTool.js';
import EventManager from '@core/Script/EventManager.js';

describe('Tilemap Select/Move and Keyboard Input Lifecycle (Bug Fix Verification)', () => {
  let prevMode;

  beforeEach(() => {
    prevMode = Config.ENGINE_MODE;
    Config.ENGINE_MODE = 'editor';
  });

  afterEach(() => {
    Config.ENGINE_MODE = prevMode;
    vi.restoreAllMocks();
  });

  describe('Keyboard Input Isolation & Blur Handler', () => {
    it('does NOT capture keys when user is typing in an HTML input or textarea', () => {
      const events = new EventManager();
      const kbd = new Keyboard(events);

      // Simulate typing 'Delete' and 'Backspace' inside an <input>
      const inputEl = document.createElement('input');
      document.body.appendChild(inputEl);

      const downEventInput = new KeyboardEvent('keydown', { key: 'Backspace' });
      Object.defineProperty(downEventInput, 'target', { value: inputEl });
      window.dispatchEvent(downEventInput);

      expect(kbd.isPressed('Backspace')).toBe(false);
      expect(kbd.isDown('Backspace')).toBe(false);

      const delEventInput = new KeyboardEvent('keydown', { key: 'Delete' });
      Object.defineProperty(delEventInput, 'target', { value: inputEl });
      window.dispatchEvent(delEventInput);

      expect(kbd.isPressed('Delete')).toBe(false);
      expect(kbd.isDown('Delete')).toBe(false);

      // Simulate typing in a textarea
      const textareaEl = document.createElement('textarea');
      document.body.appendChild(textareaEl);

      const taEvent = new KeyboardEvent('keydown', { key: 'v' });
      Object.defineProperty(taEvent, 'target', { value: textareaEl });
      window.dispatchEvent(taEvent);

      expect(kbd.isPressed('v')).toBe(false);
      expect(kbd.isDown('v')).toBe(false);

      // Normal keydown outside input (e.g. on window/canvas) is still captured
      const canvasEl = document.createElement('canvas');
      const normalEvent = new KeyboardEvent('keydown', { key: 'v' });
      Object.defineProperty(normalEvent, 'target', { value: canvasEl });
      window.dispatchEvent(normalEvent);

      expect(kbd.isPressed('v')).toBe(true);
      expect(kbd.isDown('v')).toBe(true);

      kbd.destroy();
      inputEl.remove();
      textareaEl.remove();
    });

    it('clears all pressed and held keys when window blur occurs', () => {
      const events = new EventManager();
      const kbd = new Keyboard(events);

      const ev = new KeyboardEvent('keydown', { key: 'a' });
      window.dispatchEvent(ev);

      expect(kbd.isDown('a')).toBe(true);
      expect(kbd.isPressed('a')).toBe(true);

      // Window blur
      window.dispatchEvent(new Event('blur'));

      expect(kbd.isDown('a')).toBe(false);
      expect(kbd.isPressed('a')).toBe(false);
      expect(kbd.keys.size).toBe(0);
      expect(kbd.pressed.size).toBe(0);

      kbd.destroy();
    });
  });

  describe('Game endFrame Lifecycle in Editor Mode', () => {
    it('calls endFrame() on keyboard and mouse at the end of Game.render() in editor mode', () => {
      const game = new Game();
      const canvas = document.createElement('canvas');
      game.setCanvas(canvas);

      // Trigger a keydown event
      const ev = new KeyboardEvent('keydown', { key: 'Delete' });
      window.dispatchEvent(ev);

      expect(game.input.keyboard.isPressed('Delete')).toBe(true);

      // In editor mode, game.render(1) should invoke endFrame()
      game.render(1);

      // Now isPressed should be cleared!
      expect(game.input.keyboard.isPressed('Delete')).toBe(false);
      // But isDown should remain true until keyup
      expect(game.input.keyboard.isDown('Delete')).toBe(true);

      if (game.input) game.input.destroy();
    });
  });

  describe('TilemapTool Select/Move vs Delete Behavior', () => {
    it('does NOT delete a selected/dragged tile when Delete is not pressed', () => {
      const game = new Game();
      const canvas = document.createElement('canvas');
      game.setCanvas(canvas);

      // Setup mock world and entity with tilemap
      const entity = {
        id: 'ent_tilemap_1',
        components: {
          Tilemap: {
            assetId: 'atlas_1',
            width: 16,
            height: 16,
            data: { '2,2': 5 } // Tile 5 at (2,2)
          }
        }
      };
      game.world = {
        layersWorld: [{ entities: [entity] }],
        layersUI: [],
        _editors: {
          activeTabId: 'ent_tilemap_1',
          activeTool: 'select',
          dragState: null,
          marqueeSelection: null
        }
      };

      const tool = new TilemapTool(game);
      game.tilemapTool = tool;

      vi.spyOn(game.input.mouse, 'isDown').mockImplementation((btn) => btn === 0);
      vi.spyOn(tool.operations, 'deleteArea');

      // Frame 1: User clicks on tile (2,2) with select tool
      // Simulate selection starting dragState
      game.world._editors.dragState = {
        data: [5],
        w: 1,
        h: 1,
        sourceX: 2,
        sourceY: 2,
        offX: 0,
        offY: 0
      };

      // Run tool update
      tool.update();

      // Ensure deleteArea was NOT called!
      expect(tool.operations.deleteArea).not.toHaveBeenCalled();
      expect(entity.components.Tilemap.data['2,2']).toBe(5);

      if (game.input) game.input.destroy();
    });

    it('does NOT delete tiles on subsequent frames after Delete key was pressed and cleared in a previous frame', () => {
      const game = new Game();
      const canvas = document.createElement('canvas');
      game.setCanvas(canvas);

      const entity = {
        id: 'ent_tilemap_1',
        components: {
          Tilemap: {
            assetId: 'atlas_1',
            width: 16,
            height: 16,
            data: { '3,3': 7 }
          }
        }
      };
      game.world = {
        layersWorld: [{ entities: [entity] }],
        layersUI: [],
        _editors: {
          activeTabId: 'ent_tilemap_1',
          activeTool: 'select',
          dragState: null,
          marqueeSelection: null
        }
      };

      const tool = new TilemapTool(game);
      game.tilemapTool = tool;
      vi.spyOn(tool.operations, 'deleteArea');

      // Frame 1: User pressed Delete in some earlier context (e.g. earlier selection)
      const delEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      window.dispatchEvent(delEvent);

      expect(game.input.keyboard.isPressed('Delete')).toBe(true);

      // Render frame 1 (editor frame cycle completes and clears isPressed via endFrame)
      game.render(1);

      expect(game.input.keyboard.isPressed('Delete')).toBe(false);

      // Frame 2: User now clicks on a tile to select/move it
      game.world._editors.dragState = {
        data: [7],
        w: 1,
        h: 1,
        sourceX: 3,
        sourceY: 3,
        offX: 0,
        offY: 0
      };

      // Render frame 2
      tool.update();

      // deleteArea should NOT be called on frame 2!
      expect(tool.operations.deleteArea).not.toHaveBeenCalled();
      expect(entity.components.Tilemap.data['3,3']).toBe(7);

      if (game.input) game.input.destroy();
    });

    it('properly deletes marquee area when Delete is intentionally pressed during marquee selection', () => {
      const game = new Game();
      const canvas = document.createElement('canvas');
      game.setCanvas(canvas);

      const entity = {
        id: 'ent_tilemap_1',
        components: {
          Tilemap: {
            assetId: 'atlas_1',
            width: 16,
            height: 16,
            data: { '1,1': 2, '2,1': 2 }
          }
        }
      };
      game.world = {
        layersWorld: [{ entities: [entity] }],
        layersUI: [],
        _editors: {
          activeTabId: 'ent_tilemap_1',
          activeTool: 'select',
          dragState: null,
          marqueeSelection: { x: 1, y: 1, w: 2, h: 1 }
        }
      };

      const tool = new TilemapTool(game);
      game.tilemapTool = tool;
      vi.spyOn(tool.operations, 'deleteArea');

      // User presses Delete
      const delEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      window.dispatchEvent(delEvent);

      tool.update();

      // deleteArea MUST be called
      expect(tool.operations.deleteArea).toHaveBeenCalledWith(entity, entity.components.Tilemap, 1, 1, 2, 1);
      expect(game.world._editors.marqueeSelection).toBeNull();

      if (game.input) game.input.destroy();
    });
  });
});
