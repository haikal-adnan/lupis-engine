import PointerRaycast from '../../System/PointerRaycast.js';

// Subsystem handler unifying hardware input modalities and pointer raycasting for script nodes
export class InputContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade({ runner }) {
    const game = this.game;

    return {
      getPointer: (targetEntity = null) => {
        return game.input ? game.input.getPointer(targetEntity || runner.owner) : null;
      },

      get pointer() {
        return this.getPointer();
      },

      getMouse: (targetEntity = null) => {
        return game.input ? (typeof game.input.getMouse === 'function' ? game.input.getMouse(targetEntity || runner.owner) : game.input.mouse) : null;
      },

      get mouse() {
        return this.getMouse();
      },

      keyboard: {
        isDown: (key) => {
          return game.input?.keyboard ? game.input.keyboard.isDown(key, runner.owner) : false;
        },

        isPressed: (key) => {
          return game.input?.keyboard ? game.input.keyboard.isPressed(key, runner.owner) : false;
        },

        isReleased: (key) => {
          return game.input?.keyboard ? game.input.keyboard.isReleased(key, runner.owner) : false;
        },

        get raw() {
          return game.input?.keyboard || null;
        }
      },

      raycast: {
        getTopEntity: () => (game.pointerRaycast ? game.pointerRaycast.getTopEntityUnderPointer(game) : PointerRaycast.getTopEntityUnderPointer(game)),
        getGlobalTransform: (entity) => PointerRaycast._getGlobalTransform(entity, game.world)
      },

      isPointerOver: (entity, useRaycast = true) => {
        const raycast = game.pointerRaycast || PointerRaycast;
        return raycast && typeof raycast.isPointerOver === 'function'
          ? raycast.isPointerOver(game, entity, useRaycast)
          : false;
      }
    };
  }
}
