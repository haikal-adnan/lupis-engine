// Top-level domain namespaces accessible on context
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
  'toolkit',
  'asset',
  'global',
  'local'
]);

// Validation methods exposed by context.assert
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

// Diagnostic logging methods exposed by context.console
export const CONTEXT_CONSOLE_METHODS = Object.freeze([
  'log',
  'warn',
  'error'
]);

// Execution flow control and variable access methods on root context
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

// Built-in properties provided directly on the root context object
export const CONTEXT_ROOT_PROPERTIES = Object.freeze([
  'owner',
  'node',
  'dt',
  'deltaTime',
  'state'
]);
