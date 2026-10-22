import { processDialogueRunner, processChoicePresenter } from './Dialogue/DialogueRunnerHelper.js';
import { processPlatformerController, processPlatformerAnimator } from './Platformer/PlatformerHelper.js';
import { processTopDownController, processTopDownAnimator } from './TopDown/TopDownHelper.js';
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
    const getCtx = (ctx) => ctx || contextParams?.context;

    return {
      dialogue: {
        runDialogue: (state, inputs, outputs, ctx) => processDialogueRunner(state, inputs, outputs, getCtx(ctx)),
        presentChoices: (state, inputs, outputs, ctx) => processChoicePresenter(state, inputs, outputs, getCtx(ctx))
      },
      platformer: {
        processController: (...args) => {
          if (args.length <= 2 || (args[2] === undefined && args[3] === undefined)) {
            return processPlatformerController(args[0], getCtx(args[1]));
          }
          return processPlatformerController(args[0], args[1], args[2], getCtx(args[3]));
        },
        processAnimator: (state, inputs, outputs, ctx) => processPlatformerAnimator(state, inputs, outputs, getCtx(ctx), contextParams?.node)
      },
      topdown: {
        processController: (...args) => {
          if (args.length <= 2 || (args[2] === undefined && args[3] === undefined)) {
            return processTopDownController(args[0], getCtx(args[1]));
          }
          return processTopDownController(args[0], args[1], args[2], getCtx(args[3]));
        },
        processAnimator: (state, inputs, outputs, ctx) => processTopDownAnimator(state, inputs, outputs, getCtx(ctx), contextParams?.node)
      },
      combat: {
        processPlatformerCombat: (state, inputs, outputs, ctx) => processPlatformerCombat(state, inputs, outputs, getCtx(ctx), contextParams?.node),
        processEnemyCombat: (...args) => {
          if (args.length <= 2 || (args[2] === undefined && args[3] === undefined)) {
            return processEnemyCombat(args[0], getCtx(args[1]));
          }
          return processEnemyCombat(args[0], args[1], args[2], getCtx(args[3]), contextParams?.node);
        }
      },
      ai: {
        processChaser: (...args) => {
          if (args.length <= 2 || (args[2] === undefined && args[3] === undefined)) {
            return processEnemyChaser(args[0], getCtx(args[1]));
          }
          return processEnemyChaser(args[0], args[1], args[2], getCtx(args[3]));
        }
      },
      collectable: {
        processCollectable: (state, inputs, outputs, ctx) => processCollectable(state, inputs, outputs, getCtx(ctx), contextParams?.node),
        applyBobbing: (target, dt, speed, amp) => applyBobbing(target, dt, speed, amp),
        checkOverlap: (target, tag, dist, ctx) => checkOverlap(target, tag, dist, getCtx(ctx)),
        playAnimationAndDestroy: (target, clip, ctx) => playAnimationAndDestroy(target, clip, getCtx(ctx), contextParams?.node),
        deactivateAndScheduleRespawn: (target, clip, respawnTime, ctx) => deactivateAndScheduleRespawn(target, clip, respawnTime, getCtx(ctx), contextParams?.node)
      }
    };
  }
}
