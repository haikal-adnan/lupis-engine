import { describe, it, expect } from 'vitest';
import { BlueprintAnimation } from '../../../../src/features/nodes/library/blueprints/BlueprintAnimation.js';
import { findBlueprintByType, findBlueprintCategory, ALL_BLUEPRINTS } from '../../../../src/features/nodes/library/blueprints/index.js';
import { validateCodePanelContract } from '../../../../src/features/nodes/contract/codePanelContract.js';

describe('BlueprintAnimation Specification', () => {
  it('is registered in ALL_BLUEPRINTS with correct metadata', () => {
    expect(BlueprintAnimation.id).toBe('game_animation');
    expect(BlueprintAnimation.label).toBe('Animation');
    expect(BlueprintAnimation.color).toBe('#E91E63');
    expect(findBlueprintCategory('game_animation')).toBe(BlueprintAnimation);
    expect(ALL_BLUEPRINTS.includes(BlueprintAnimation)).toBe(true);
  });

  it('contains all required atomic animation nodes', () => {
    const expectedTypes = [
      'uiButtonScaleEffect',
      'logicTweenValue',
      'tweenMoveTo',
      'tweenScaleTo',
      'tweenRotateTo',
      'tweenResizeTo',
      'tweenFadeTo',
      'tweenCropTo',
      'tweenFillAmount',
      'actionShakeTransform'
    ];
    expectedTypes.forEach(type => {
      const item = BlueprintAnimation.items.find(i => i.type === type);
      expect(item, `Node type ${type} should exist in BlueprintAnimation`).toBeDefined();
      expect(findBlueprintByType(type)).toBeDefined();
    });
  });

  it('Tween Value (logicTweenValue) supports single execution trigger with onTick', () => {
    const tweenNode = BlueprintAnimation.items.find(i => i.type === 'logicTweenValue');
    expect(tweenNode).toBeDefined();
    const code = tweenNode.defaultData.data.code;
    expect(code).toContain('context.onTick');
    expect(code).toContain("context.triggerFlow('onUpdate')");
    expect(code).toContain("context.triggerFlow('onComplete')");
  });

  it('Fade To (tweenFadeTo) supports SpriteRenderer, ShapeRenderer, and TextRenderer', () => {
    const fadeNode = BlueprintAnimation.items.find(i => i.type === 'tweenFadeTo');
    expect(fadeNode).toBeDefined();
    const code = fadeNode.defaultData.data.code;
    expect(code).toContain('SpriteRenderer');
    expect(code).toContain('ShapeRenderer');
    expect(code).toContain('TextRenderer');
  });

  it('Fill Amount (tweenFillAmount) supports 4 directions and uses 0-100 scale with instant duration 0', () => {
    const fillNode = BlueprintAnimation.items.find(i => i.type === 'tweenFillAmount');
    expect(fillNode).toBeDefined();
    expect(fillNode.defaultData.data.values.fill).toBe(100);
    expect(fillNode.defaultData.data.values.duration).toBe(0);

    const directionOptions = fillNode.defaultData.data.options.direction.map(o => o.value);
    expect(directionOptions).toContain('left_to_right');
    expect(directionOptions).toContain('right_to_left');
    expect(directionOptions).toContain('top_to_bottom');
    expect(directionOptions).toContain('bottom_to_top');

    const code = fillNode.defaultData.data.code;
    expect(code).toContain('left_to_right');
    expect(code).toContain('right_to_left');
    expect(code).toContain('bottom_to_top');
    expect(code).toContain('top_to_bottom');
  });

  it('passes codePanelContract validation for all items in BlueprintAnimation', () => {
    BlueprintAnimation.items.forEach(item => {
      const code = item.defaultData?.data?.code;
      expect(code, `Node ${item.type} should have code`).toBeTruthy();

      const inputs = [...(item.defaultData.inputs || [])];
      if (item.dynamicMode === 'inputProperty' && item.defaultData?.data?.propertyOptions) {
        item.defaultData.data.propertyOptions.forEach(opt => {
          inputs.push({ id: opt.value, dataType: opt.type });
        });
      }

      const outputs = [...(item.defaultData.outputs || [])];
      if (item.dynamicMode === 'outputProperty' && item.defaultData?.data?.propertyOptions) {
        item.defaultData.data.propertyOptions.forEach(opt => {
          outputs.push({ id: opt.value, dataType: opt.type });
        });
      }

      const validation = validateCodePanelContract(code, {
        node: {
          id: item.type,
          inputs,
          outputs
        }
      });

      expect(validation.hasSyntaxError, `Node ${item.type} has syntax error: ${validation.issues.join(', ')}`).toBe(false);
      expect(validation.isValid, `Node ${item.type} failed validation: ${validation.issues.join(', ')}`).toBe(true);
    });
  });
});
