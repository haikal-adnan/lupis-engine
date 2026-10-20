export const CONTEXT_NAMESPACES = Object.freeze([
  'entity',
  'layer',
  'prefab',
  'collider',
  'input',
  'ui',
  'signal',
  'lifecycle',
  'transition',
  'camera',
  'scene',
  'state',
  'console',
  'assert',
  'audio',
  'toolkit'
]);

export const CONTEXT_ASSERT_METHODS = Object.freeze([
  'isTrue',
  'isFalse',
  'exists',
  'hasComponent',
  'isNumber',
  'isString',
  'isBoolean',
  'isObject',
  'isArray',
  'inRange',
  'fail'
]);

export const CONTEXT_CONSOLE_METHODS = Object.freeze([
  'log',
  'warn',
  'error'
]);

export const CONTEXT_ROOT_METHODS = Object.freeze([
  'onTick',
  'triggerFlow',
  'onGameStart',
  'onSceneStart',
  'onGamePause',
  'onGameResume',
  'onGameRestart',
  'onGameQuit',
  'onQuit',
  'isPaused',
  'notify',
  'getLocal',
  'setLocal',
  'getGlobal',
  'setGlobal',
  'getVariable',
  'hasVariable'
]);

export const CONTEXT_ROOT_PROPERTIES = Object.freeze([
  'owner',
  'node',
  'dt',
  'deltaTime',
  'state'
]);
