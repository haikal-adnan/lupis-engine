import { BlueprintAnimator } from './BlueprintAnimator.js';
import { BlueprintBoolean } from './BlueprintBoolean.js';
import { BlueprintCamera } from './BlueprintCamera.js';
import { BlueprintCollectionHelper } from './BlueprintCollectionHelper.js';
import { BlueprintCollider } from './BlueprintCollider.js';
import { BlueprintComparison } from './BlueprintComparison.js';
import { BlueprintEntity } from './BlueprintEntity.js';
import { BlueprintEvent } from './BlueprintEvent.js';
import { BlueprintHelper } from './BlueprintHelper.js';
import { BlueprintKeyboard } from './BlueprintKeyboard.js';
import { BlueprintLayer } from './BlueprintLayer.js';
import { BlueprintLifecycle } from './BlueprintLifecycle.js';
import { BlueprintList } from './BlueprintList.js';
import { BlueprintLoop } from './BlueprintLoop.js';
import { BlueprintMap } from './BlueprintMap.js';
import { BlueprintMath } from './BlueprintMath.js';
import { BlueprintMouse } from './BlueprintMouse.js';
import { BlueprintObject } from './BlueprintObject.js';
import { BlueprintPhysics } from './BlueprintPhysics.js';
import { BlueprintPointer } from './BlueprintPointer.js';
import { BlueprintRandom } from './BlueprintRandom.js';
import { BlueprintRenderer } from './BlueprintRenderer.js';
import { BlueprintScene } from './BlueprintScene.js';
import { BlueprintString } from './BlueprintString.js';
import { BlueprintSystem } from './BlueprintSystem.js';
import { BlueprintTransform } from './BlueprintTransform.js';
import { BlueprintTransition } from './BlueprintTransition.js';
import { BlueprintVariable } from './BlueprintVariable.js';
import { BlueprintVisualNovelHelper } from './BlueprintVisualNovelHelper.js';
export { BlueprintCategoryTemplate } from './Blueprint.js';
export {
  BlueprintAnimator,
  BlueprintBoolean,
  BlueprintCamera,
  BlueprintCollectionHelper,
  BlueprintCollider,
  BlueprintComparison,
  BlueprintEntity,
  BlueprintEvent,
  BlueprintHelper,
  BlueprintKeyboard,
  BlueprintLayer,
  BlueprintLifecycle,
  BlueprintList,
  BlueprintLoop,
  BlueprintMap,
  BlueprintMath,
  BlueprintMouse,
  BlueprintObject,
  BlueprintPhysics,
  BlueprintPointer,
  BlueprintRandom,
  BlueprintRenderer,
  BlueprintScene,
  BlueprintString,
  BlueprintSystem,
  BlueprintTransform,
  BlueprintTransition,
  BlueprintVariable,
  BlueprintVisualNovelHelper
};

export const ALL_BLUEPRINTS = Object.freeze([
  BlueprintRandom,
  BlueprintEntity,
  BlueprintLoop,
  BlueprintHelper,
  BlueprintList,
  BlueprintMap,
  BlueprintCollectionHelper,
  BlueprintRenderer,
  BlueprintLifecycle,
  BlueprintBoolean,
  BlueprintComparison,
  BlueprintKeyboard,
  BlueprintPointer,
  BlueprintTransform,
  BlueprintMath,
  BlueprintSystem,
  BlueprintString,
  BlueprintObject,
  BlueprintCamera,
  BlueprintCollider,
  BlueprintPhysics,
  BlueprintLayer,
  BlueprintScene,
  BlueprintMouse,
  BlueprintAnimator,
  BlueprintTransition,
  BlueprintEvent,
  BlueprintVariable,
  BlueprintVisualNovelHelper
]);

export const allBlueprints = ALL_BLUEPRINTS;

export function findBlueprintByType(type) {
  for (const group of ALL_BLUEPRINTS) {
    if (Array.isArray(group.items)) {
      const found = group.items.find(item => item.type === type);
      if (found) return found;
    }
  }
  return null;
}

export function findBlueprintCategory(categoryIdOrLabel) {
  return ALL_BLUEPRINTS.find(
    g => g.id === categoryIdOrLabel || g.label === categoryIdOrLabel
  ) || null;
}
