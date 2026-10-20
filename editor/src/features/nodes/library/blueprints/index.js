import { BlueprintFlow } from './BlueprintFlow.js';
import { BlueprintInput } from './BlueprintInput.js';
import { BlueprintEntity } from './BlueprintEntity.js';
import { BlueprintPhysics } from './BlueprintPhysics.js';
import { BlueprintRenderer } from './BlueprintRenderer.js';
import { BlueprintAnimation } from './BlueprintAnimation.js';
import { BlueprintCollections } from './BlueprintCollections.js';
import { BlueprintMath } from './BlueprintMath.js';
import { BlueprintLifecycle } from './BlueprintLifecycle.js';
import { BlueprintSystem } from './BlueprintSystem.js';
import { BlueprintHelperTool } from './BlueprintHelperTool.js';
import { BlueprintUI } from './BlueprintUI.js';
import { BlueprintDialogue } from './BlueprintDialogue.js';
import { BlueprintPlatformer } from './BlueprintPlatformer.js';
import { BlueprintAI } from './BlueprintAI.js';

export { BlueprintCategoryTemplate } from './Blueprint.js';

export {
  BlueprintFlow,
  BlueprintInput,
  BlueprintEntity,
  BlueprintPhysics,
  BlueprintRenderer,
  BlueprintAnimation,
  BlueprintCollections,
  BlueprintMath,
  BlueprintLifecycle,
  BlueprintSystem,
  BlueprintHelperTool,
  BlueprintUI,
  BlueprintDialogue,
  BlueprintPlatformer,
  BlueprintAI,
  // Backward compatibility re-export aliases
  BlueprintFlow as BlueprintBoolean,
  BlueprintFlow as BlueprintComparison,
  BlueprintFlow as BlueprintLoop,
  BlueprintFlow as BlueprintHelper,
  BlueprintInput as BlueprintKeyboard,
  BlueprintInput as BlueprintMouse,
  BlueprintInput as BlueprintPointer,
  BlueprintEntity as BlueprintObject,
  BlueprintEntity as BlueprintTransform,
  BlueprintEntity as BlueprintLayer,
  BlueprintPhysics as BlueprintCollider,
  BlueprintRenderer as BlueprintTransition,
  BlueprintRenderer as BlueprintCamera,
  BlueprintAnimation as BlueprintAnimator,
  BlueprintCollections as BlueprintList,
  BlueprintCollections as BlueprintMap,
  BlueprintCollections as BlueprintCollectionHelper,
  BlueprintMath as BlueprintRandom,
  BlueprintLifecycle as BlueprintScene,
  BlueprintSystem as BlueprintAudio,
  BlueprintSystem as BlueprintVariable,
  BlueprintSystem as BlueprintString,
  BlueprintSystem as BlueprintEvent,
  BlueprintHelperTool as BlueprintVisualNovelHelper
};

export const ALL_BLUEPRINTS = Object.freeze([
  BlueprintFlow,
  BlueprintInput,
  BlueprintEntity,
  BlueprintPhysics,
  BlueprintRenderer,
  BlueprintAnimation,
  BlueprintCollections,
  BlueprintMath,
  BlueprintLifecycle,
  BlueprintSystem,
  BlueprintHelperTool
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
