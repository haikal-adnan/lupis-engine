import { describe, it, expect, vi } from 'vitest';
import { findBlueprintByType, BlueprintSystem } from '@/features/nodes/library/blueprints/index.js';

describe('convertType Blueprint Specification (Unified anyTo* Primitive)', () => {
  const def = BlueprintSystem.items.find(i => i.type === 'convertType');

  function executeNode(blueprint, inputs = {}) {
    const outputs = {};
    const context = {
      state: {},
      dt: 0.016,
      triggerFlow: vi.fn()
    };
    const nodeData = blueprint.defaultData;
    const fn = new Function('inputs', 'outputs', 'context', 'node', nodeData.data.code);
    fn(inputs, outputs, context, nodeData);
    return { outputs, context };
  }

  it('is registered with valid metadata and canonical ports', () => {
    expect(def).toBeDefined();
    expect(findBlueprintByType('convertType')).toBeDefined();
    expect(def.defaultData.inputs.map(i => i.id)).toEqual(['value', 'targetType', 'defaultNumber', 'pretty']);
    expect(def.defaultData.outputs.map(o => o.id)).toEqual(['result', 'asString', 'asNumber', 'asBoolean']);
  });

  it('maps legacy anyTo* queries via findBlueprintByType aliases', () => {
    expect(findBlueprintByType('anyToString')).toBe(def);
    expect(findBlueprintByType('anyToBoolean')).toBe(def);
    expect(findBlueprintByType('anyToNumber')).toBe(def);
  });

  it('converts value to string by default or when targetType is string', () => {
    const { outputs } = executeNode(def, {
      value: { score: 100 },
      targetType: 'string',
      pretty: false
    });
    expect(outputs.result).toBe('{"score":100}');
    expect(outputs.asString).toBe('{"score":100}');
  });

  it('converts value to boolean when targetType is boolean', () => {
    const { outputs: outTrue } = executeNode(def, {
      value: 'true',
      targetType: 'boolean'
    });
    expect(outTrue.result).toBe(true);
    expect(outTrue.asBoolean).toBe(true);

    const { outputs: outFalse } = executeNode(def, {
      value: '0',
      targetType: 'boolean'
    });
    expect(outFalse.result).toBe(false);
    expect(outFalse.asBoolean).toBe(false);
  });

  it('converts value to number when targetType is number with fallback default', () => {
    const { outputs: outValid } = executeNode(def, {
      value: '42.5',
      targetType: 'number'
    });
    expect(outValid.result).toBe(42.5);
    expect(outValid.asNumber).toBe(42.5);

    const { outputs: outInvalid } = executeNode(def, {
      value: 'not-a-number',
      targetType: 'number',
      defaultNumber: 99
    });
    expect(outInvalid.result).toBe(99);
    expect(outInvalid.asNumber).toBe(99);
  });

  it('always populates all specific conversion outputs (asString, asNumber, asBoolean)', () => {
    const { outputs } = executeNode(def, {
      value: 123
    });
    expect(outputs.asString).toBe('123');
    expect(outputs.asNumber).toBe(123);
    expect(outputs.asBoolean).toBe(true);
    expect(outputs.result).toBe('123');
  });
});
