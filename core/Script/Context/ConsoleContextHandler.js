import { formatNotificationMessage } from '../../Util/ScriptContextUtils.js';

export class ConsoleContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  _emitLog(meta, level, args) {
    const rawMessage = args.map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a))).join(' ');
    const message = `${meta.prefix} ${rawMessage}`;
    const eventName = `console:${level}`;
    this.game?.events?.emit(eventName, {
      type: level,
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

  notify({ nodeMeta }, message, source = 'Notification', type = 'log') {
    const rawMessage = formatNotificationMessage(message);
    const formattedMessage = `${nodeMeta.prefix} ${rawMessage}`;
    const eventType = type === 'error' ? 'console:error' : (type === 'warn' ? 'console:warn' : 'console:log');

    this.game?.events?.emit(eventType, {
      type: type || 'log',
      time: Date.now(),
      message: formattedMessage,
      source: source || 'Notification',
      context: {
        scene: nodeMeta.scene,
        entityScriptId: nodeMeta.entityScriptId,
        script: nodeMeta.script,
        node: nodeMeta.node
      }
    });
  }

  createFacade({ nodeMeta }) {
    return {
      log: (...args) => this._emitLog(nodeMeta, 'log', args),
      warn: (...args) => this._emitLog(nodeMeta, 'warn', args),
      error: (...args) => this._emitLog(nodeMeta, 'error', args)
    };
  }
}
