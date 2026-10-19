export class AssertContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade({ failAssert }) {
    return {
      isTrue: (condition, message = 'Assertion failed: expected value to be true') => {
        if (!condition) failAssert(message);
        return true;
      },
      isFalse: (condition, message = 'Assertion failed: expected value to be false') => {
        if (condition) failAssert(message);
        return true;
      },
      exists: (value, message = 'Assertion failed: value does not exist (null or undefined)') => {
        if (value === null || value === undefined) failAssert(message);
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
        if (typeof value !== 'string') failAssert(message);
        return value;
      },
      isBoolean: (value, message = 'Assertion failed: expected value to be a boolean') => {
        if (typeof value !== 'boolean') failAssert(message);
        return value;
      },
      isObject: (value, message = 'Assertion failed: expected value to be an object') => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) failAssert(message);
        return value;
      },
      isArray: (value, message = 'Assertion failed: expected value to be an array') => {
        if (!Array.isArray(value)) failAssert(message);
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
    };
  }
}
