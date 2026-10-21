import { processDialogueRunner, processChoicePresenter } from './Dialogue/DialogueRunnerHelper.js';
import { processPlatformerController, processPlatformerAnimator } from './Platformer/PlatformerHelper.js';
import { processPlatformerCombat, processEnemyCombat } from './Combat/CombatHelper.js';
import { processEnemyChaser } from './AI/AIHelper.js';
import {
  processCollectable,
  applyBobbing,
  checkOverlap,
  playAnimationAndDestroy,
  deactivateAndScheduleRespawn
} from './Collectable/CollectableHelper.js';

export class ToolkitContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade(contextParams) {
    const getCtx = (ctx) => ctx || contextParams.context;

    return {
      dialogue: {
        runDialogue: (state, inputs, outputs, ctx) => processDialogueRunner(state, inputs, outputs, getCtx(ctx)),
        presentChoices: (state, inputs, outputs, ctx) => processChoicePresenter(state, inputs, outputs, getCtx(ctx))
      },
      platformer: {
        processController: (state, inputs, outputs, ctx) => processPlatformerController(state, inputs, outputs, getCtx(ctx)),
        processAnimator: (state, inputs, outputs, ctx) => processPlatformerAnimator(state, inputs, outputs, getCtx(ctx), contextParams.node)
      },
      combat: {
        processPlatformerCombat: (state, inputs, outputs, ctx) => processPlatformerCombat(state, inputs, outputs, getCtx(ctx), contextParams.node),
        processEnemyCombat: (state, inputs, outputs, ctx) => processEnemyCombat(state, inputs, outputs, getCtx(ctx), contextParams.node)
      },
      ai: {
        processChaser: (state, inputs, outputs, ctx) => processEnemyChaser(state, inputs, outputs, getCtx(ctx))
      },
      collectable: {
        processCollectable: (state, inputs, outputs, ctx) => processCollectable(state, inputs, outputs, getCtx(ctx)),
        applyBobbing: (target, dt, speed, amp) => applyBobbing(target, dt, speed, amp),
        checkOverlap: (target, tag, dist, ctx) => checkOverlap(target, tag, dist, getCtx(ctx)),
        playAnimationAndDestroy: (target, clip, ctx) => playAnimationAndDestroy(target, clip, getCtx(ctx)),
        deactivateAndScheduleRespawn: (target, clip, respawnTime, ctx) => deactivateAndScheduleRespawn(target, clip, respawnTime, getCtx(ctx))
      }
    };
  }
}
