import { 
  Film, 
  PlayCircle, 
  PauseCircle, 
  Activity, 
  Settings2, 
  Layers,
  FileEdit
} from 'lucide-vue-next';

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
      icon: PlayCircle,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Play Animation', headerColor: '#9C27B0', category: 'Animation' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB', defaultValue: 'self' },
          { id: 'clip_id', label: 'Clip Name/ID', dataType: 'string', color: '#FFB74D' },
          { id: 'reset', label: 'Reset Frame?', dataType: 'boolean', color: '#f472b6', defaultValue: true }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { id: 'on_start', label: 'On Start', dataType: 'execution', color: '#69F0AE' },
          { id: 'on_complete', label: 'On Complete', dataType: 'execution', color: '#FF5252' }
        ],
        data: {
          code: `const targetId = inputs['Target ID (Self)'];
const clipIdInput = inputs['Clip Name/ID'];
const reset = inputs['Reset Frame?'];
const entity = context.getEntity(targetId);

if (!entity?.components?.SpriteAnimator || !clipIdInput) {
  outputs['Out'] = true;
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
outputs['On Start'] = true;
return;`
        }
      } 
    },
    { 
      type: 'pause_animation', 
      label: 'Pause Animation', 
      description: 'Temporarily pauses the animation at the current frame.',
      icon: PauseCircle,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Pause Animation', headerColor: '#9C27B0', category: 'Animation' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB', defaultValue: 'self' }
        ],
        outputs: [{ id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }],
        data: {
          code: `const targetId = inputs['Target ID (Self)'];
const entity = context.getEntity(targetId);

if (entity?.components?.SpriteAnimator) {
  entity.components.SpriteAnimator.isPlaying = false;
}

outputs['Out'] = true;
return;`
        }
      } 
    },
    { 
      type: 'get_animator', 
      label: 'Get Animator', 
      icon: Activity, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Animator', headerColor: '#AB47BC', category: 'Animation' },
        data: {
          propertyOptions: [
            { value: 'currentClip', label: 'Current Clip ID', type: 'string' },
            { value: 'isPlaying', label: 'Is Playing?', type: 'boolean' },
            { value: 'active', label: 'Is Enabled?', type: 'boolean' },
            { value: 'flipX', label: 'Flip Horizontal', type: 'boolean' }
          ],
          code: `const targetId = inputs['Target ID (Self)'];
const entity = context.getEntity(targetId);

if (entity?.components?.SpriteAnimator) {
  const comp = entity.components.SpriteAnimator;
  outputs['Current Clip ID'] = comp.currentClip || null;
  outputs['Is Playing?'] = !!comp.isPlaying;
  outputs['Is Enabled?'] = !!comp.active;
  const clip = comp.clips?.find(c => c.id === comp.currentClip);
  outputs['Flip Horizontal'] = clip ? !!clip.flipX : false;
}
return;`
        },
        inputs: [{ id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB', defaultValue: 'self' }], 
        outputs: [] 
      } 
    },
    { 
      type: 'set_animator', 
      label: 'Set Animator', 
      icon: Settings2,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Animator', headerColor: '#AB47BC', category: 'Animation' },
        data: {
          propertyOptions: [
            { value: 'currentClip', label: 'Set Current Clip', type: 'string' },
            { value: 'active', label: 'Is Enabled', type: 'boolean' },
            { value: 'flipX', label: 'Flip Horizontal', type: 'boolean' }
          ],
          code: `const targetId = inputs['Target ID (Self)'];
const entity = context.getEntity(targetId);

if (!entity?.components?.SpriteAnimator) {
  outputs['Out'] = true;
  return;
}

const comp = entity.components.SpriteAnimator;
const currentClipInput = inputs['Set Current Clip'];

if (currentClipInput !== undefined && currentClipInput !== null) {
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

const active = inputs['Is Enabled'];
if (active !== undefined && active !== null) {
  comp.active = Boolean(active);
}

const flipX = inputs['Flip Horizontal'];
if (flipX !== undefined && flipX !== null) {
  const clip = comp.clips?.find(c => c.id === comp.currentClip);
  if (clip) clip.flipX = Boolean(flipX);
}

outputs['Out'] = true;
return;`
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB', defaultValue: 'self' }
        ], 
        outputs: [{ id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }]
      } 
    },
    { 
      type: 'get_clip_prop', 
      label: 'Get Clip Prop', 
      icon: Layers,
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Clip Property', headerColor: '#00897B', category: 'Animation' },
        data: {
          propertyOptions: [
            { value: 'fps', label: 'Frame Rate', type: 'number' },
            { value: 'isLooping', label: 'Is Looping?', type: 'boolean' },
            { value: 'frameCount', label: 'Total Frames', type: 'number' }
          ],
          code: `const clipIdInput = inputs['Clip ID'];
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
      outputs['Is Looping?'] = !!clip.isLooping;
      outputs['Total Frames'] = clip.frames ? clip.frames.length : 0;
    }
  }
}
return;`
        },
        inputs: [{ id: 'clip_id', label: 'Clip ID', dataType: 'string', color: '#FFB74D' }],
        outputs: [] 
      } 
    },
    { 
      type: 'set_clip_prop', 
      label: 'Set Clip Prop', 
      icon: FileEdit,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Clip Property', headerColor: '#00897B', category: 'Animation' },
        data: {
          propertyOptions: [
            { value: 'fps', label: 'Set FPS', type: 'number' },
            { value: 'isLooping', label: 'Set Looping', type: 'boolean' }
          ],
          code: `const clipIdInput = inputs['Clip ID'];
const entity = context.owner;

if (!clipIdInput || !entity?.components?.SpriteAnimator?.clips) {
  outputs['Out'] = true;
  return;
}

const targetStr = String(clipIdInput);
const clip = entity.components.SpriteAnimator.clips.find(c => 
  c.scriptId === targetStr || 
  c.name === targetStr || 
  c.id === targetStr
);

if (clip) {
  const fps = inputs['Set FPS'];
  if (fps !== undefined && fps !== null) clip.fps = Number(fps);

  const isLooping = inputs['Set Looping'];
  if (isLooping !== undefined && isLooping !== null) clip.isLooping = Boolean(isLooping);
}

outputs['Out'] = true;
return;`
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'clip_id', label: 'Clip ID', dataType: 'string', color: '#FFB74D' }
        ],
        outputs: [{ id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }]
      } 
    }
  ]
};