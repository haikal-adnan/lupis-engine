import PointerRaycast from "../System/PointerRaycast.js";

export class ScriptAssertionError extends Error {
  constructor(message, nodeId, nodeType, nodeName = null) {
    super(message);
    this.name = 'ScriptAssertionError';
    this.nodeId = nodeId;
    this.nodeType = nodeType;
    this.nodeName = nodeName || nodeId;
  }
}

export function getScriptContextMetadata(game, runner, node) {
  if (runner && typeof runner.getContextMetadata === 'function') {
    return runner.getContextMetadata(node);
  }

  const sceneName = game?.sceneSystem?.getCurrentSceneScriptId?.() || 
                    game?.world?.currentSceneScriptId || 
                    game?.world?.currentScene?.scriptId || 
                    game?.sceneSystem?.getCurrentSceneId?.() || 
                    'Scene';

  const entityScriptId = runner?.owner 
    ? (runner.owner.scriptId || runner.owner.id || 'Entity') 
    : 'Global';

  const scriptName = runner?.data?.scriptId || 
                     game?.world?.scripts?.[runner?.scriptId]?.scriptId || 
                     runner?.data?.title || 
                     runner?.scriptId || 
                     'Script';

  const nodeName = node ? (
    node.settings?.headerTitle || 
    node.data?.settings?.headerTitle || 
    node.title || 
    node.label || 
    node.type || 
    node.id || 
    'Node'
  ) : 'Node';

  return {
    scene: sceneName,
    entityScriptId: String(entityScriptId),
    script: scriptName,
    node: nodeName,
    prefix: `[${sceneName}] [${entityScriptId}] [${scriptName}] [${nodeName}]`
  };
}

/**
 * ContextSystem (Engine Gate 2 / Subsystem Facade)
 * Strict runtime gateway for script nodes.
 * 
 * Rules:
 * 1. Node code NEVER accesses `context.game`.
 * 2. Missing resources (Entity, Layer, Global Variable) THROW explicit errors with context.
 * 3. All access is cleanly segmented into domain facades.
 */
export default class ContextSystem {
  constructor(game) {
    this.game = game;
  }

  createExecutionContext(runner, node) {
    const game = this.game;
    const nodeState = typeof runner.getNodeState === 'function' 
      ? runner.getNodeState(node.id) 
      : (node._state = node._state || {});

    const nodeMeta = getScriptContextMetadata(this.game, runner, node);
    const nodeName = nodeMeta.node;

    const failAssert = (msg) => {
      const formatted = `${nodeMeta.prefix} [Assert Error] ${msg} (node: '${nodeName}')`;
      this.game.events.emit('console:error', {
        type: 'error',
        time: Date.now(),
        message: formatted,
        source: 'Assert',
        context: {
          scene: nodeMeta.scene,
          entityScriptId: nodeMeta.entityScriptId,
          script: nodeMeta.script,
          node: nodeName
        }
      });
      throw new ScriptAssertionError(formatted, node?.id, node?.type, nodeName);
    };

    return {
      owner: runner.owner,
      node: node,
      get dt() { return game.deltaTime; },
      get deltaTime() { return game.deltaTime; },
      state: nodeState,

      console: {
        log: (...args) => {
          const meta = getScriptContextMetadata(this.game, runner, node);
          const rawMessage = args.map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a))).join(' ');
          const message = `${meta.prefix} ${rawMessage}`;
          this.game.events.emit('console:log', {
            type: 'log',
            time: Date.now(),
            message,
            source: 'Script',
            context: {
              scene: meta.scene,
              entityScriptId: meta.entityScriptId,
              script: meta.script,
              node: meta.node
            }
          });
        },
        warn: (...args) => {
          const meta = getScriptContextMetadata(this.game, runner, node);
          const rawMessage = args.map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a))).join(' ');
          const message = `${meta.prefix} ${rawMessage}`;
          this.game.events.emit('console:warn', {
            type: 'warn',
            time: Date.now(),
            message,
            source: 'Script',
            context: {
              scene: meta.scene,
              entityScriptId: meta.entityScriptId,
              script: meta.script,
              node: meta.node
            }
          });
        },
        error: (...args) => {
          const meta = getScriptContextMetadata(this.game, runner, node);
          const rawMessage = args.map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a))).join(' ');
          const message = `${meta.prefix} ${rawMessage}`;
          this.game.events.emit('console:error', {
            type: 'error',
            time: Date.now(),
            message,
            source: 'Script',
            context: {
              scene: meta.scene,
              entityScriptId: meta.entityScriptId,
              script: meta.script,
              node: meta.node
            }
          });
        }
      },

      assert: {
        isTrue: (condition, message = 'Assertion failed: expected value to be true') => {
          if (!condition) {
            failAssert(message);
          }
          return true;
        },

        isFalse: (condition, message = 'Assertion failed: expected value to be false') => {
          if (condition) {
            failAssert(message);
          }
          return true;
        },

        exists: (value, message = 'Assertion failed: value does not exist (null or undefined)') => {
          if (value === null || value === undefined) {
            failAssert(message);
          }
          return value;
        },

        hasComponent: (entity, componentName, message) => {
          if (!entity || !entity.components || !entity.components[componentName]) {
            const fallbackMsg = `Assertion failed: entity does not have component '${componentName}'`;
            failAssert(message || fallbackMsg);
          }
          return entity.components[componentName];
        },

        isNumber: (value, message = 'Assertion failed: expected value to be a valid number') => {
          const num = Number(value);
          if (value === '' || value === null || value === undefined || Number.isNaN(num)) {
            failAssert(message);
          }
          return num;
        },

        isString: (value, message = 'Assertion failed: expected value to be a string') => {
          if (typeof value !== 'string') {
            failAssert(message);
          }
          return value;
        },

        isBoolean: (value, message = 'Assertion failed: expected value to be a boolean') => {
          if (typeof value !== 'boolean') {
            failAssert(message);
          }
          return value;
        },

        isObject: (value, message = 'Assertion failed: expected value to be an object') => {
          if (!value || typeof value !== 'object' || Array.isArray(value)) {
            failAssert(message);
          }
          return value;
        },

        isArray: (value, message = 'Assertion failed: expected value to be an array') => {
          if (!Array.isArray(value)) {
            failAssert(message);
          }
          return value;
        },

        inRange: (value, min, max, message) => {
          const num = Number(value);
          if (Number.isNaN(num) || num < min || num > max) {
            const fallbackMsg = `Assertion failed: expected ${value} to be between ${min} and ${max}`;
            failAssert(message || fallbackMsg);
          }
          return num;
        },

        fail: (message = 'Assertion failed') => {
          failAssert(message);
        }
      },

      onTick: (callback) => {
        if (!runner._customTickListeners) {
          runner._customTickListeners = new Map();
        }
        runner._customTickListeners.set(node.id, callback);
      },

      triggerFlow: (portName) => {
        const nodeOutputs = runner.nodeOutputs.get(node.id);
        if (nodeOutputs && nodeOutputs[portName] === true) {
          nodeOutputs[portName] = false;
        }
        runner.executeFlow(node.id, portName);
      },

      onGameStart: (callback) => {
        const handler = () => {
          if (runner._isScriptActive()) callback();
        };

        if (this.game.hasStarted) {
          handler();
        } else {
          this.game.events.once('game:start', handler);
          runner._registeredEvents.push({ eventName: 'game:start', callback: handler });
        }
      },

      onSceneStart: (callback) => {
        const handler = (sceneName) => {
          if (runner._isScriptActive()) {
            callback(sceneName);
          }
        };

        this.game.events.once('scene:start', handler);
        runner._registeredEvents.push({ eventName: 'scene:start', callback: handler });
      },

      onGamePause: (callback) => {
        const handler = () => {
          if (runner._isScriptActive()) {
            callback();
          }
        };

        this.game.events.on('game:pause', handler);
        runner._registeredEvents.push({ eventName: 'game:pause', callback: handler });
      },

      onGameResume: (callback) => {
        const handler = () => {
          if (runner._isScriptActive()) {
            callback();
          }
        };

        this.game.events.on('game:resume', handler);
        runner._registeredEvents.push({ eventName: 'game:resume', callback: handler });
      },

      onGameRestart: (callback) => {
        const handler = () => {
          if (runner._isScriptActive()) {
            callback();
          }
        };

        this.game.events.on('game:restart', handler);
        runner._registeredEvents.push({ eventName: 'game:restart', callback: handler });
      },

      onGameQuit: (callback) => {
        const handler = () => {
          if (runner._isScriptActive()) {
            callback();
          }
        };

        this.game.events.on('game:quit', handler);
        runner._registeredEvents.push({ eventName: 'game:quit', callback: handler });
      },

      onQuit: (callback) => {
        const handler = () => {
          if (runner._isScriptActive()) {
            callback();
          }
        };

        this.game.events.on('game:quit', handler);
        runner._registeredEvents.push({ eventName: 'game:quit', callback: handler });
      },

      isPaused: () => this.game.isPaused,

      // Entity subsystem facade (Engine Gate 2: throws on unresolvable target)
      entity: {
        get: (targetId) => {
          if (!targetId || targetId === 'self') {
            if (!runner.owner) {
              throw new Error(`[ContextSystem] Owner entity does not exist for 'self' target (node: '${nodeName}', type: '${node?.type || 'unknown'}')`);
            }
            return runner.owner;
          }

          const searchKey = String(targetId).trim();
          const searchLower = searchKey.toLowerCase();
          const searchSlug = searchLower.replace(/\s+/g, '_');
          const entities = this.game.world?.entities || [];

          const found = entities.find(e => 
            e.id === searchKey || 
            (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug))
          );

          return found || null;
        },

        destroy: (entity) => {
          if (!entity) return;
          this.game.entitySystem.destroyEntity(entity);
        },

        clone: (entity) => {
          return this.game.entitySystem.cloneEntity(entity);
        },

        getParent: (entity) => {
          if (!entity || !entity.parentId) return null;
          const entities = this.game.world?.entities || [];
          return entities.find(e => e.id === entity.parentId) || null;
        },

        getChildren: (entity) => {
          if (!entity) return [];
          const entities = this.game.world?.entities || [];
          return entities.filter(e => e.parentId === entity.id);
        },

        getRoot: (entity) => {
          if (!entity) return null;
          let current = entity;
          const entities = this.game.world?.entities || [];
          while (current && current.parentId) {
            const parent = entities.find(e => e.id === current.parentId);
            if (!parent) break;
            current = parent;
          }
          return current;
        },

        findClosestByTag: (tag, fromXOrEntity, optFromY) => {
          const entities = this.game.world?.entities || [];
          let originX = 0;
          let originY = 0;
          let excludeId = null;

          if (typeof fromXOrEntity === 'object' && fromXOrEntity !== null) {
            excludeId = fromXOrEntity.id;
            const t = fromXOrEntity.components?.Transform || fromXOrEntity.components?.UITransform;
            originX = t ? (t.x || 0) : 0;
            originY = t ? (t.y || 0) : 0;
          } else {
            originX = Number(fromXOrEntity) || 0;
            originY = Number(optFromY) || 0;
          }

          let closest = null;
          let minDistanceSq = Infinity;

          for (const other of entities) {
            if (other.active === false) continue;
            if (excludeId && other.id === excludeId) continue;
            const otherTag = other.tag || other.components?.Tags?.value;
            if (otherTag === tag) {
              const t = other.components?.Transform || other.components?.UITransform;
              const ox = t ? (t.x || 0) : 0;
              const oy = t ? (t.y || 0) : 0;
              const dx = ox - originX;
              const dy = oy - originY;
              const distSq = dx * dx + dy * dy;
              if (distSq < minDistanceSq) {
                minDistanceSq = distSq;
                closest = other;
              }
            }
          }
          return closest;
        },

        getAllByTag: (tag) => {
          const entities = this.game.world?.entities || [];
          return entities.filter(e => {
            if (e.active === false) return false;
            const otherTag = e.tag || e.components?.Tags?.value;
            return otherTag === tag;
          });
        },

        findByName: (name) => {
          const searchLower = String(name).trim().toLowerCase();
          const searchSlug = searchLower.replace(/\s+/g, '_');
          const entities = this.game.world?.entities || [];
          return entities.find(e => 
            (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug)) || 
            e.id === name
          ) || null;
        },

        findByScriptId: (scriptId) => {
          const searchLower = String(scriptId).trim().toLowerCase();
          const searchSlug = searchLower.replace(/\s+/g, '_');
          const entities = this.game.world?.entities || [];
          return entities.find(e => 
            (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug))
          ) || null;
        }
      },

      prefab: {
        spawn: (...args) => this.game.prefabSystem.spawnPrefab(...args)
      },

      layer: {
        get: (layerId) => {
          if (!layerId || layerId === 'self') {
            const ownerLayerId = runner.owner?.layerId;
            const allLayers = this.game.world?.allLayers || [];
            const layer = allLayers.find(l => l.id === ownerLayerId || l.scriptId === ownerLayerId) || allLayers[0];
            return layer || null;
          }

          if (this.game.layerSystem && typeof this.game.layerSystem.getLayer === 'function') {
            const l = this.game.layerSystem.getLayer(layerId);
            if (l) return l;
          }

          const allLayers = this.game.world?.allLayers || [];
          const search = String(layerId).trim().toLowerCase();
          const slug = search.replace(/\s+/g, '_');
          const found = allLayers.find(l => 
            l.id === layerId || 
            (l.scriptId && (l.scriptId.toLowerCase() === search || l.scriptId.toLowerCase() === slug))
          );

          return found || null;
        }
      },

      collider: {
        checkSolid: (entity) => this.game.colliderSystem.checkSolid(entity),
        checkOverlap: (entity, filterTag) => this.game.colliderSystem.checkOverlap(entity, filterTag),
        moveAndSlide: (entity, moveX, moveY) => this.game.colliderSystem.moveAndSlide(entity, moveX, moveY)
      },

      input: {
        getPointer: () => (this.game.input ? this.game.input.getPointer() : null),
        get pointer() {
          return this.getPointer();
        },
        get mouse() {
          return game.input?.mouse || null;
        },
        keyboard: {
          isDown: (key) => (this.game.input?.keyboard ? this.game.input.keyboard.isDown(key) : false),
          isPressed: (key) => (this.game.input?.keyboard ? this.game.input.keyboard.isPressed(key) : false),
          isReleased: (key) => (this.game.input?.keyboard ? this.game.input.keyboard.isReleased(key) : false),
          get raw() {
            return game.input?.keyboard || null;
          }
        },
        raycast: {
          getTopEntity: () => (this.game.pointerRaycast ? this.game.pointerRaycast.getTopEntityUnderPointer(this.game) : PointerRaycast.getTopEntityUnderPointer(this.game)),
          getGlobalTransform: (entity) => PointerRaycast._getGlobalTransform(entity, this.game.world)
        },
        isPointerOver: (entity, useRaycast = true) => {
          if (!entity) return false;
          if (entity.active === false || entity.visible === false) return false;
          const raycast = this.game.pointerRaycast || PointerRaycast;
          if (useRaycast) {
            if (!this.game.world || !raycast || typeof raycast.getTopEntityUnderPointer !== 'function') return false;
            const topEntity = raycast.getTopEntityUnderPointer(this.game);
            if (!topEntity) return false;
            if (topEntity.active === false || topEntity.visible === false) return false;
            const matchesEntity = (cand) => {
              if (!cand) return false;
              if (cand.active === false || cand.visible === false) return false;
              if (cand === entity) return true;
              if (entity.id && cand.id === entity.id) return true;
              if (entity.scriptId && cand.scriptId === entity.scriptId) return true;
              return false;
            };
            if (matchesEntity(topEntity)) return true;
            let currentParentId = topEntity.parentId;
            while (currentParentId) {
              const p = this.game.world?.entities?.find(e => e.id === currentParentId || (e.scriptId && e.scriptId === currentParentId));
              if (p && (p.active === false || p.visible === false)) return false;
              if (matchesEntity(p)) return true;
              currentParentId = p ? p.parentId : null;
            }
            return false;
          } else {
            if (!this.game.input || typeof this.game.input.getPointer !== 'function') return false;
            const pointer = this.game.input.getPointer();
            if (!pointer) return false;
            const canvas = this.game.renderer?.gl?.canvas || this.game.renderer?.canvas || { width: 1920, height: 1080 };
            const canvasW = canvas.clientWidth || canvas.width || 1920;
            const canvasH = canvas.clientHeight || canvas.height || 1080;
            const uiSettings = this.game.world?.settings?.ui || { width: 1920, height: 1080 };
            const camera = this.game.camera || { x: 0, y: 0, scale: 1 };
            const hasUITransform = Boolean(entity.components?.UITransform);

            const uiPointer = {
              x: (pointer.x / canvasW) * uiSettings.width,
              y: (pointer.y / canvasH) * uiSettings.height
            };
            const halfW = canvasW / 2;
            const halfH = canvasH / 2;
            const worldPointer = {
              x: camera.x + (pointer.x - halfW) / (camera.scale || 1),
              y: camera.y + (pointer.y - halfH) / (camera.scale || 1)
            };

            if (!raycast || typeof raycast._getGlobalTransform !== 'function' || typeof raycast._checkIntersection !== 'function') return false;
            const globalT = raycast._getGlobalTransform(entity, this.game.world);
            let drawX = globalT.x || 0;
            let drawY = globalT.y || 0;
            const targetPointer = hasUITransform ? uiPointer : worldPointer;

            if (hasUITransform) {
              const t = entity.components.UITransform;
              const anchorX = t.anchorX ?? 0.5;
              const anchorY = t.anchorY ?? 0.5;
              drawX = (uiSettings.width * anchorX) + (globalT.x || 0);
              drawY = (uiSettings.height * anchorY) + (globalT.y || 0);
            }

            return raycast._checkIntersection(entity, entity.components?.Transform || entity.components?.UITransform, drawX, drawY, targetPointer.x, targetPointer.y);
          }
        }
      },

      ui: {
        isUiLayer: (layerId) => {
          const uiLayerIds = new Set((this.game.world?.layersUI || []).map(l => l.id));
          return uiLayerIds.has(layerId);
        },
        dispatchEvent: (event) => {
          const canvas = this.game.renderer?.gl?.canvas || this.game.renderer?.canvas || this.game.canvas;
          if (canvas && typeof canvas.dispatchEvent === 'function') {
            canvas.dispatchEvent(event);
          }
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(event);
          }
        },
        notify: (message, source = 'Notification', type = 'log') => {
          const meta = getScriptContextMetadata(this.game, runner, node);
          const rawMessage = typeof message === 'object' && message !== null ? JSON.stringify(message) : String(message ?? '');
          const formattedMessage = `${meta.prefix} ${rawMessage}`;
          const eventType = type === 'error' ? 'console:error' : (type === 'warn' ? 'console:warn' : 'console:log');

          this.game.events.emit(eventType, {
            type: type || 'log',
            time: Date.now(),
            message: formattedMessage,
            source: source || 'Notification',
            context: {
              scene: meta.scene,
              entityScriptId: meta.entityScriptId,
              script: meta.script,
              node: meta.node
            }
          });
        }
      },

      notify: (message, source = 'Notification', type = 'log') => {
        const meta = getScriptContextMetadata(this.game, runner, node);
        const rawMessage = typeof message === 'object' && message !== null ? JSON.stringify(message) : String(message ?? '');
        const formattedMessage = `${meta.prefix} ${rawMessage}`;
        const eventType = type === 'error' ? 'console:error' : (type === 'warn' ? 'console:warn' : 'console:log');

        this.game.events.emit(eventType, {
          type: type || 'log',
          time: Date.now(),
          message: formattedMessage,
          source: source || 'Notification',
          context: {
            scene: meta.scene,
            entityScriptId: meta.entityScriptId,
            script: meta.script,
            node: meta.node
          }
        });
      },

      signal: {
        emit: (signalName, data) => {
          this.game.events.emit(signalName, data);
        },
        on: (signalName, callback) => {
          this.game.events.on(signalName, callback);
          runner._registeredEvents.push({ eventName: signalName, callback });
        }
      },

      lifecycle: {
        pause: () => this.game.pauseGame(),
        resume: () => this.game.resumeGame(),
        restart: () => this.game.restartGame(),
        quit: () => this.game.quitGame(),
        isPaused: () => this.game.isPaused
      },

      audio: {
        play: (targetEntityOrAssetId, options = {}) => {
          if (!targetEntityOrAssetId || targetEntityOrAssetId === 'self') {
            const ent = runner.owner;
            if (ent && ent.components?.Audio) {
              return this.game.audioSystem.play(ent, options);
            }
          }
          if (typeof targetEntityOrAssetId === 'object' && targetEntityOrAssetId !== null) {
            if (targetEntityOrAssetId.components?.Audio) {
              return this.game.audioSystem.play(targetEntityOrAssetId, options);
            }
          }
          if (typeof targetEntityOrAssetId === 'string') {
            const ent = this.entity.get(targetEntityOrAssetId);
            if (ent && ent.components?.Audio) {
              return this.game.audioSystem.play(ent, options);
            }
          }
          return this.game.audioSystem.playSound(targetEntityOrAssetId, options);
        },
        stop: (targetEntityOrId) => {
          if (!targetEntityOrId || targetEntityOrId === 'self') {
            return this.game.audioSystem.stop(runner.owner?.id);
          }
          if (typeof targetEntityOrId === 'object' && targetEntityOrId !== null) {
            return this.game.audioSystem.stop(targetEntityOrId.id);
          }
          const ent = this.entity.get(targetEntityOrId);
          if (ent) {
            return this.game.audioSystem.stop(ent.id);
          }
          return this.game.audioSystem.stop(targetEntityOrId);
        },
        stopAll: () => {
          this.game.audioSystem.stopAll();
        },
        setVolume: (type, volume) => {
          this.game.audioSystem.setVolume(type, volume);
        },
        getVolume: (type) => {
          return this.game.audioSystem.getVolume(type);
        },
        setMasterVolume: (volume) => this.game.audioSystem.setMasterVolume(volume),
        getMasterVolume: () => this.game.audioSystem.getMasterVolume(),
        setBackgroundVolume: (volume) => this.game.audioSystem.setBackgroundVolume(volume),
        getBackgroundVolume: () => this.game.audioSystem.getBackgroundVolume(),
        setSfxVolume: (volume) => this.game.audioSystem.setSfxVolume(volume),
        getSfxVolume: () => this.game.audioSystem.getSfxVolume(),
        setVoiceVolume: (volume) => this.game.audioSystem.setVoiceVolume(volume),
        getVoiceVolume: () => this.game.audioSystem.getVoiceVolume(),
        setMute: (type, isMute) => this.game.audioSystem.setMute(type, isMute),
        isMuted: (type) => this.game.audioSystem.isMuted(type)
      },

      transition: {
        fade: (mode, duration, color, onComplete) => {
          const ts = this.game.transitionSystem;
          if (!ts) return;
          if (mode === 'fade_out') {
            ts.fadeOut(duration, color, onComplete);
          } else if (mode === 'fade_in') {
            ts.fadeIn(duration, color, onComplete);
          } else if (mode === 'fade') {
            const half = duration / 2;
            ts.fadeOut(half, color, () => {
              ts.fadeIn(half, color, onComplete);
            });
          }
        }
      },

      camera: {
        follow: (targetEntity, speed = 0.1, offset = { x: 0, y: 0 }) => {
          this.game.camera.setTarget(targetEntity, speed, offset);
        },
        stopFollow: () => {
          this.game.camera.clearTarget();
        },
        setTarget: (targetEntity, speed = 0.1, offset = { x: 0, y: 0 }) => {
          this.game.camera.setTarget(targetEntity, speed, offset);
        },
        clearTarget: () => {
          this.game.camera.clearTarget();
        },
        snapTo: (x, y) => {
          this.game.camera.snapTo(x, y);
        },
        setTransform: (x, y, scale, speed) => {
          this.game.camera.snapTo(x, y);
          if (scale !== undefined) this.game.camera.scale = scale;
          if (speed !== undefined) this.game.camera.lerp = speed;
        },
        getInfo: () => ({
          x: this.game.camera.x,
          y: this.game.camera.y,
          scale: this.game.camera.scale,
          smoothSpeed: this.game.camera.lerp,
          targetEntity: this.game.camera.target?.scriptId || '',
          hasTarget: Boolean(this.game.camera.target)
        }),
        get x() { return game.camera.x; },
        set x(val) { game.camera.x = val; },
        get y() { return game.camera.y; },
        set y(val) { game.camera.y = val; },
        get scale() { return game.camera.scale; },
        set scale(val) { game.camera.scale = val; },
        get lerp() { return game.camera.lerp; },
        set lerp(val) { game.camera.lerp = val; },
        get target() { return game.camera.target; }
      },

      asset: {
        get: (idOrScriptId) => {
          if (!idOrScriptId) return null;
          const search = String(idOrScriptId).trim();
          const searchLower = search.toLowerCase();
          const searchSlug = searchLower.replace(/\s+/g, '_');
          if (this.game.world?.assetMap?.[search]) return this.game.world.assetMap[search];
          const list = this.game.world?.assetList || [];
          return list.find(a => 
            a.id === search || 
            (a.scriptId && (a.scriptId.toLowerCase() === searchLower || a.scriptId.toLowerCase() === searchSlug))
          ) || null;
        },
        resolveId: (idOrScriptId) => {
          if (!idOrScriptId) return null;
          const found = this.game.world?.assetMap?.[idOrScriptId];
          if (found && found.id) return found.id;
          const search = String(idOrScriptId).trim();
          const searchLower = search.toLowerCase();
          const searchSlug = searchLower.replace(/\s+/g, '_');
          const list = this.game.world?.assetList || [];
          const matched = list.find(a => 
            a.id === search || 
            (a.scriptId && (a.scriptId.toLowerCase() === searchLower || a.scriptId.toLowerCase() === searchSlug))
          );
          return matched ? matched.id : idOrScriptId;
        }
      },

      scene: {
        load: (sceneName) => this.game.sceneSystem.queueLoadScene(sceneName),
        restart: () => this.game.sceneSystem.restartScene(),
        getCurrentName: () => this.game.sceneSystem.getCurrentSceneName(),
        getCurrentId: () => this.game.sceneSystem.getCurrentSceneId(),
        getCurrentData: () => this.game.sceneSystem.getCurrentScene(),
        getAllScenes: () => this.game.sceneSystem.getAvailableScenes()
      },

      getLocal: (key) => runner.getLocalVariable(key),
      setLocal: (key, val) => runner.setLocalVariable(key, val),
      getGlobal: (key) => {
        const val = this.game.variables?.getGlobal(key);
        if (val === undefined) {
          throw new Error(`[ContextSystem] Global variable '${key}' not found in registry (node: '${nodeName}')`);
        }
        return val;
      },
      setGlobal: (key, val) => {
        this.game.variables?.setGlobal(key, val);
      },
      getVariable: (key) => runner.getVariable(key),
      hasVariable: (key) => runner.hasVariable(key)
    };
  }
}