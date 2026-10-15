import { Film } from 'lucide-vue-next';

export const BlueprintAnimator = {
  id: 'game_animator',
  label: 'Animator',
  color: '#8E24AA',
  icon: Film,
  items: [
    {
      type: 'playAnimation',
      label: 'Play Animation',
      description: 'Plays the animation. Use On Complete for logic execution after the animation finishes.',
      dynamicMode: 'none',
      defaultData: {
        settings: { headerTitle: 'Play Animation', headerColor: '#8E24AA', category: 'Animator' },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'clipId', dataType: 'string', color: '#F48FB1' },
          { id: 'reset', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onStart', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onComplete', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            clipId: '',
            reset: true
          },
          code: 
`const targetId = inputs.targetEntity;
const clipIdInput = inputs.clipId;
const reset = inputs.reset;
const entity = context.assert.exists(context.entity.get(targetId));
const animator = context.assert.hasComponent(entity, 'SpriteAnimator');
const targetStr = clipIdInput;

const clips = animator.clips || [];
const targetClip = clips.find(c => c.scriptId === targetStr || c.id === targetStr);

animator.currentClip = targetClip ? targetClip.id : targetStr;
animator.isPlaying = true;

if (reset !== false) {
  animator._activeClipId = null;
  if (targetClip) {
    targetClip.frameIndex = 0;
  }
}

animator._onCompleteCallback = () => {
  outputs.onComplete = true;
  context.triggerFlow('onComplete');
};

outputs.execOut = true;
outputs.onStart = true;
return;`
        }
      }
    },
    {
      type: 'pauseAnimation',
      label: 'Pause Animation',
      description: 'Temporarily pauses the animation at the current frame.',
      dynamicMode: 'none',
      defaultData: {
        settings: { headerTitle: 'Pause Animation', headerColor: '#8E24AA', category: 'Animator' },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self'
          },
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const animator = context.assert.hasComponent(entity, 'SpriteAnimator');

animator.isPlaying = false;

outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'getAnimator',
      label: 'Get Animator',
      description: 'Mendapatkan properti animator dari entity target.',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: { headerTitle: 'Get Animator', headerColor: '#8E24AA', category: 'Animator' },
        inputs: [
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: { targetEntity: 'self' },
          propertyOptions: [
            { value: 'currentClip', label: 'Current Clip ID', type: 'string', color: '#F48FB1' },
            { value: 'isPlaying', label: 'Is Playing?', type: 'boolean', color: '#E57373' },
            { value: 'active', label: 'Is Enabled?', type: 'boolean', color: '#E57373' },
            { value: 'flipX', label: 'Flip Horizontal', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'SpriteAnimator');
const clips = comp.clips || [];
const clip = clips.find(c => c.scriptId === comp.currentClip || c.id === comp.currentClip);

outputs.currentClip = comp.currentClip;
outputs.isPlaying = comp.isPlaying;
outputs.active = comp.active;
outputs.flipX = clip ? clip.flipX : false;
return;`
        }
      }
    },
    {
      type: 'setAnimator',
      label: 'Set Animator',
      description: 'Mengatur properti animator pada entity target.',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: { headerTitle: 'Set Animator', headerColor: '#8E24AA', category: 'Animator' },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { targetEntity: 'self' },
          propertyOptions: [
            { value: 'currentClip', label: 'Set Current Clip', type: 'string', color: '#F48FB1' },
            { value: 'active', label: 'Is Enabled', type: 'boolean', color: '#E57373' },
            { value: 'flipX', label: 'Flip Horizontal', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'SpriteAnimator');

if ('currentClip' in inputs) {
  const targetStr = inputs.currentClip;
  const clips = comp.clips || [];
  const targetClip = clips.find(c => c.scriptId === targetStr || c.id === targetStr);
  const resolvedId = targetClip ? targetClip.id : targetStr;

  if (comp.currentClip !== resolvedId) {
    comp.currentClip = resolvedId;
    comp._elapsedTime = 0;
    comp.isPlaying = true;
    if (targetClip) targetClip.frameIndex = 0;
  }
}

if ('active' in inputs) {
  comp.active = inputs.active;
}

if ('flipX' in inputs) {
  const clips = comp.clips || [];
  const clip = clips.find(c => c.scriptId === comp.currentClip || c.id === comp.currentClip);
  if (clip) clip.flipX = inputs.flipX;
}

outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'getClipProp',
      label: 'Get Clip Prop',
      description: 'Mendapatkan properti spesifik dari animasi clip.',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: { headerTitle: 'Get Clip Property', headerColor: '#8E24AA', category: 'Animator' },
        inputs: [
          { id: 'clipId', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [],
        data: {
          values: {
            clipId: ''
          },
          propertyOptions: [
            { value: 'fps', label: 'Frame Rate', type: 'number', color: '#64B5F6' },
            { value: 'isLooping', label: 'Is Looping?', type: 'boolean', color: '#E57373' },
            { value: 'frameCount', label: 'Total Frames', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const clipIdInput = inputs.clipId;
const entity = context.assert.exists(context.owner);
const comp = context.assert.hasComponent(entity, 'SpriteAnimator');
const clips = comp.clips || [];
const targetStr = clipIdInput;
const clip = clips.find(c => c.scriptId === targetStr || c.id === targetStr);

if (clip) {
  outputs.fps = clip.fps;
  outputs.isLooping = clip.isLooping;
  outputs.frameCount = clip.frames ? clip.frames.length : 0;
}
return;`
        }
      }
    },
    {
      type: 'setClipProp',
      label: 'Set Clip Prop',
      description: 'Mengatur properti spesifik dari animasi clip.',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: { headerTitle: 'Set Clip Property', headerColor: '#8E24AA', category: 'Animator' },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'clipId', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            clipId: ''
          },
          propertyOptions: [
            { value: 'fps', label: 'Set FPS', type: 'number', color: '#64B5F6' },
            { value: 'isLooping', label: 'Set Looping', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const clipIdInput = inputs.clipId;
const entity = context.assert.exists(context.owner);
const comp = context.assert.hasComponent(entity, 'SpriteAnimator');
const clips = comp.clips || [];
const targetStr = clipIdInput;
const clip = clips.find(c => c.scriptId === targetStr || c.id === targetStr);

if (clip) {
  if ('fps' in inputs) clip.fps = inputs.fps;
  if ('isLooping' in inputs) clip.isLooping = inputs.isLooping;
}

outputs.execOut = true;
return;`
        }
      }
    }
  ]
};