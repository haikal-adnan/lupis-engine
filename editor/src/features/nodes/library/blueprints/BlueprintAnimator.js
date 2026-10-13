import { Film } from 'lucide-vue-next';

export const BlueprintAnimator = {
  id: 'game_animator',
  label: 'Animator',
  color: '#8E24AA',
  icon: Film,
  items: [
    {
      type: 'play_animation',
      label: 'Play Animation',
      description: 'Plays the animation. Use On Complete for logic execution after the animation finishes.',
      dynamicMode: 'none',
      defaultData: {
        settings: { headerTitle: 'Play Animation', headerColor: '#8E24AA', category: 'Animator' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'clip_id', label: 'Clip Name/ID', dataType: 'string', color: '#F48FB1' },
          { id: 'reset', label: 'Reset Frame?', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'on_start', label: 'On Start', dataType: 'execution', color: '#FFFFFF' },
          { id: 'on_complete', label: 'On Complete', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`const targetId = inputs['Target ID (Self)'] ?? inputs['target'] ?? 'self';
const clipIdInput = inputs['Clip Name/ID'] ?? inputs['clip_id'];
const reset = inputs['Reset Frame?'] ?? inputs['reset'];
const entity = context.getEntity ? context.getEntity(targetId) : context.entity?.get(targetId);

if (!entity?.components?.SpriteAnimator || !clipIdInput) {
  outputs['Out'] = true;
  outputs['exec_out'] = true;
  return;
}

const animator = entity.components.SpriteAnimator;
const targetStr = String(clipIdInput);

const targetClip = animator.clips?.find(c => 
  c.scriptId === targetStr || 
  c.name === targetStr || 
  c.id === targetStr
);

const resolvedInternalId = targetClip ? targetClip.id : targetStr;

animator.currentClip = resolvedInternalId;
animator.isPlaying = true;

if (reset !== false) {
  animator._activeClipId = null;
  if (targetClip) {
    targetClip.frameIndex = 0;
  }
}

animator._onCompleteCallback = () => {
  context.executeFlow('On Complete');
};

outputs['Out'] = true;
outputs['exec_out'] = true;
outputs['On Start'] = true;
outputs['on_start'] = true;
return;`
        }
      }
    },
    {
      type: 'pause_animation',
      label: 'Pause Animation',
      description: 'Temporarily pauses the animation at the current frame.',
      dynamicMode: 'none',
      defaultData: {
        settings: { headerTitle: 'Pause Animation', headerColor: '#8E24AA', category: 'Animator' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`const targetId = inputs['Target ID (Self)'] ?? inputs['target'] ?? 'self';
const entity = context.getEntity ? context.getEntity(targetId) : context.entity?.get(targetId);

if (entity?.components?.SpriteAnimator) {
  entity.components.SpriteAnimator.isPlaying = false;
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'get_animator',
      label: 'Get Animator',
      description: 'Mendapatkan properti animator dari entity target.',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: { headerTitle: 'Get Animator', headerColor: '#8E24AA', category: 'Animator' },
        inputs: [
          { id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: { target: 'self' },
          propertyOptions: [
            { value: 'currentClip', label: 'Current Clip ID', type: 'string', color: '#F48FB1' },
            { value: 'isPlaying', label: 'Is Playing?', type: 'boolean', color: '#E57373' },
            { value: 'active', label: 'Is Enabled?', type: 'boolean', color: '#E57373' },
            { value: 'flipX', label: 'Flip Horizontal', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const targetId = inputs['Target ID (Self)'] ?? inputs['target'] ?? 'self';
const entity = context.getEntity ? context.getEntity(targetId) : context.entity?.get(targetId);

if (entity?.components?.SpriteAnimator) {
  const comp = entity.components.SpriteAnimator;
  const clip = comp.clips?.find(c => c.id === comp.currentClip);

  outputs['Current Clip ID'] = comp.currentClip || null;
  outputs['currentClip'] = comp.currentClip || null;
  outputs['Is Playing?'] = !!comp.isPlaying;
  outputs['isPlaying'] = !!comp.isPlaying;
  outputs['Is Enabled?'] = !!comp.active;
  outputs['active'] = !!comp.active;
  outputs['Flip Horizontal'] = clip ? !!clip.flipX : false;
  outputs['flipX'] = clip ? !!clip.flipX : false;
}
return;`
        }
      }
    },
    {
      type: 'set_animator',
      label: 'Set Animator',
      description: 'Mengatur properti animator pada entity target.',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: { headerTitle: 'Set Animator', headerColor: '#8E24AA', category: 'Animator' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { target: 'self' },
          propertyOptions: [
            { value: 'currentClip', label: 'Set Current Clip', type: 'string', color: '#F48FB1' },
            { value: 'active', label: 'Is Enabled', type: 'boolean', color: '#E57373' },
            { value: 'flipX', label: 'Flip Horizontal', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const targetId = inputs['Target ID (Self)'] ?? inputs['target'] ?? 'self';
const entity = context.getEntity ? context.getEntity(targetId) : context.entity?.get(targetId);

if (!entity?.components?.SpriteAnimator) {
  outputs['Out'] = true;
  outputs['exec_out'] = true;
  return;
}

const comp = entity.components.SpriteAnimator;
const currentClipInput = inputs['Set Current Clip'] ?? inputs['currentClip'];

if (currentClipInput !== undefined && currentClipInput !== null && currentClipInput !== '') {
  const targetStr = String(currentClipInput);
  const targetClip = comp.clips?.find(c => 
    c.scriptId === targetStr || 
    c.name === targetStr || 
    c.id === targetStr
  );
  const resolvedInternalId = targetClip ? targetClip.id : targetStr;

  if (comp.currentClip !== resolvedInternalId) {
    comp.currentClip = resolvedInternalId;
    comp._elapsedTime = 0;
    comp.isPlaying = true;
    if (targetClip) targetClip.frameIndex = 0;
  }
}

const active = inputs['Is Enabled'] ?? inputs['active'];
if (active !== undefined && active !== null) {
  comp.active = Boolean(active);
}

const flipX = inputs['Flip Horizontal'] ?? inputs['flipX'];
if (flipX !== undefined && flipX !== null) {
  const clip = comp.clips?.find(c => c.id === comp.currentClip);
  if (clip) clip.flipX = Boolean(flipX);
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'get_clip_prop',
      label: 'Get Clip Prop',
      description: 'Mendapatkan properti spesifik dari animasi clip.',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: { headerTitle: 'Get Clip Property', headerColor: '#8E24AA', category: 'Animator' },
        inputs: [
          { id: 'clip_id', label: 'Clip ID', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [],
        data: {
          propertyOptions: [
            { value: 'fps', label: 'Frame Rate', type: 'number', color: '#64B5F6' },
            { value: 'isLooping', label: 'Is Looping?', type: 'boolean', color: '#E57373' },
            { value: 'frameCount', label: 'Total Frames', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const clipIdInput = inputs['Clip ID'] ?? inputs['clip_id'];
if (clipIdInput) {
  const entity = context.owner;
  if (entity?.components?.SpriteAnimator?.clips) {
    const targetStr = String(clipIdInput);
    const clip = entity.components.SpriteAnimator.clips.find(c => 
      c.scriptId === targetStr || 
      c.name === targetStr || 
      c.id === targetStr
    );

    if (clip) {
      outputs['Frame Rate'] = clip.fps || 12;
      outputs['fps'] = clip.fps || 12;
      outputs['Is Looping?'] = !!clip.isLooping;
      outputs['isLooping'] = !!clip.isLooping;
      outputs['Total Frames'] = clip.frames ? clip.frames.length : 0;
      outputs['frameCount'] = clip.frames ? clip.frames.length : 0;
    }
  }
}
return;`
        }
      }
    },
    {
      type: 'set_clip_prop',
      label: 'Set Clip Prop',
      description: 'Mengatur properti spesifik dari animasi clip.',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: { headerTitle: 'Set Clip Property', headerColor: '#8E24AA', category: 'Animator' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'clip_id', label: 'Clip ID', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          propertyOptions: [
            { value: 'fps', label: 'Set FPS', type: 'number', color: '#64B5F6' },
            { value: 'isLooping', label: 'Set Looping', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const clipIdInput = inputs['Clip ID'] ?? inputs['clip_id'];
const entity = context.owner;

if (!clipIdInput || !entity?.components?.SpriteAnimator?.clips) {
  outputs['Out'] = true;
  outputs['exec_out'] = true;
  return;
}

const targetStr = String(clipIdInput);
const clip = entity.components.SpriteAnimator.clips.find(c => 
  c.scriptId === targetStr || 
  c.name === targetStr || 
  c.id === targetStr
);

if (clip) {
  const fps = inputs['Set FPS'] ?? inputs['fps'];
  if (fps !== undefined && fps !== null && fps !== '') clip.fps = Number(fps);

  const isLooping = inputs['Set Looping'] ?? inputs['isLooping'];
  if (isLooping !== undefined && isLooping !== null) clip.isLooping = Boolean(isLooping);
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    }
  ]
};