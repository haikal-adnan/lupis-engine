import { GenerateUUID, sanitizeScriptId } from '@utils/utils.js';

export const componentSchema = {
  Transform: (data = {}, defaults = { width: 100, height: 100 }) => ({
    x: Number(data.x ?? 0),
    y: Number(data.y ?? 0),
    rotation: Number(data.rotation ?? 0),
    scaleX: Number(data.scaleX ?? 1),
    scaleY: Number(data.scaleY ?? 1),
    pivotX: Number(data.pivotX ?? 0.5),
    pivotY: Number(data.pivotY ?? 0.5),
    flipX: Boolean(data.flipX ?? false),
    flipY: Boolean(data.flipY ?? false),
    width: Number(data.width ?? defaults.width),
    height: Number(data.height ?? defaults.height),
    isRatioLocked: Boolean(data.isRatioLocked ?? false),
    isScaleLocked: Boolean(data.isScaleLocked ?? true),
    overridden: Boolean(data.overridden ?? false)
  }),

  UITransform: (data = {}, defaults = { width: 160, height: 40 }) => ({
    ...componentSchema.Transform(data, defaults),
    anchorX: Number(data.anchorX ?? 0.5),
    anchorY: Number(data.anchorY ?? 0.5),
    overridden: Boolean(data.overridden ?? false)
  }),

  Audio: (data = {}) => {
    const validTypes = ['background', 'sfx', 'voice'];
    const rawType = data.audioType || data.type || 'sfx';
    const audioType = validTypes.includes(rawType) ? rawType : 'sfx';

    return {
      assetId: data.assetId || null,
      audioType,
      isMute: Boolean(data.isMute ?? false),
      volume: Number(data.volume ?? 1.0),
      pitch: Number(data.pitch ?? 1.0),
      loop: Boolean(data.loop ?? false),
      autoplay: Boolean(data.autoplay ?? false),
      spatial: Boolean(data.spatial ?? false),
      persist: Boolean(data.persist ?? false),
      fadeIn: Number(data.fadeIn ?? 0.0),
      fadeOut: Number(data.fadeOut ?? 0.0),
      refDistance: Number(data.refDistance ?? 100),
      maxDistance: Number(data.maxDistance ?? 1000),
      ...data,
      audioType,
      overridden: Boolean(data.overridden ?? false)
    };
  },

  Collider: (data = {}) => ({
    data: Array.isArray(data.data) ? data.data.map(shape => ({
      id: shape.id,
      scriptId: shape.scriptId ? sanitizeScriptId(shape.scriptId, shape.scriptId) : undefined,
      type: shape.type || "solid",
      enabled: Boolean(shape.enabled ?? true),
      autoFit: Boolean(shape.autoFit ?? false),
      offsetX: Number(shape.offsetX ?? 0),
      offsetY: Number(shape.offsetY ?? 0),
      width: Number(shape.width ?? 32),
      height: Number(shape.height ?? 32),
      rotation: Number(shape.rotation ?? 0),
      pivotX: Number(shape.pivotX ?? 0),
      pivotY: Number(shape.pivotY ?? 0),
    })) : [{
      type: data.type || "solid",
      enabled: Boolean(data.enabled ?? true),
      autoFit: Boolean(data.autoFit ?? false),
      offsetX: Number(data.offsetX ?? 0),
      offsetY: Number(data.offsetY ?? 0),
      width: Number(data.width ?? 32),
      height: Number(data.height ?? 32),
      rotation: Number(data.rotation ?? 0),
      pivotX: Number(data.pivotX ?? 0),
      pivotY: Number(data.pivotY ?? 0),
    }],
    overridden: Boolean(data.overridden ?? false)
  }),

  Physics: (data = {}) => ({
    enabled: Boolean(data.enabled ?? true),
    type: data.type || "dynamic",
    mass: Number(data.mass ?? 1.0),
    gravityScale: Number(data.gravityScale ?? 1.0),
    isFrozen: Boolean(data.isFrozen ?? false),
    drag: Number(data.drag ?? 1.0),
    velocityX: Number(data.velocityX ?? 0),
    velocityY: Number(data.velocityY ?? 0),
    isGrounded: Boolean(data.isGrounded ?? false),
    movementState: data.movementState || 'idle',
    facingDirection: data.facingDirection || "right",
    ...data,
    overridden: Boolean(data.overridden ?? false)
  }),

  SpriteAnimator: (data = {}) => {
    const rawClips = Array.isArray(data.clips)
      ? data.clips
      : (data.clips && typeof data.clips === 'object' && Object.keys(data.clips).length > 0
          ? Object.values(data.clips)
          : []);

    const cleanClips = rawClips.map(clip => {
      const scriptId = sanitizeScriptId(
        clip.scriptId || "clip_default",
        "clip_default"
      );
      const clean = {
        id: clip.id || GenerateUUID(),
        scriptId: scriptId,
        type: clip.type || "clip",
        parentId: clip.parentId || null,
        assetId: clip.assetId || null,
        fps: Number(clip.fps ?? 12),
        isLooping: Boolean(clip.isLooping ?? clip.loop ?? true),
        frames: Array.isArray(clip.frames) ? clip.frames : [],
        filterMode: clip.filterMode || "pixelated",
        useSDF: Boolean(clip.useSDF ?? false),
        ...clip
      };
      delete clean.name;
      delete clean.clipName;
      return clean;
    });

    return {
      currentClip: data.currentClip || (cleanClips.length > 0 ? cleanClips[0].scriptId : null),
      clips: cleanClips,
      active: Boolean(data.active ?? true),
      isPlaying: Boolean(data.isPlaying ?? true),
      overridden: Boolean(data.overridden ?? false)
    };
  },

  SpriteRenderer: (inputData = {}) => ({
    assetId: inputData.assetId || null,
    sourceX: Number(inputData.sourceX ?? 0),
    sourceY: Number(inputData.sourceY ?? 0),
    sourceWidth: Number(inputData.sourceWidth ?? 100),
    sourceHeight: Number(inputData.sourceHeight ?? 100),
    color: inputData.color || "#FFFFFF",
    opacity: Number(inputData.opacity ?? 1),
    filterMode: inputData.filterMode || "pixelated",
    useSDF: Boolean(inputData.useSDF ?? false),
    ...inputData,
    overridden: Boolean(inputData.overridden ?? false)
  }),

  TextRenderer: (inputData = {}) => ({
    value: inputData.value || "New Text",
    mode: inputData.mode || "static",
    assetId: inputData.assetId || null,
    fontSize: Number(inputData.fontSize ?? 24),
    color: inputData.color || "#FFFFFF",
    opacity: Number(inputData.opacity ?? 1),
    align: inputData.align || "left",
    alignLine: inputData.alignLine || inputData.alignV || inputData.verticalAlign || "top",
    maxLine: Math.max(1, Number(inputData.maxLine ?? 1)),
    autoLine: Boolean(inputData.autoLine ?? true),
    lineSpacing: Number(inputData.lineSpacing ?? 1.2),
    letterSpacing: Number(inputData.letterSpacing ?? 0),
    overflow: inputData.overflow || "wrap",
    outlineWidth: Number(inputData.outlineWidth ?? 0),
    outlineColor: inputData.outlineColor || "#000000",
    shadowEnabled: Boolean(inputData.shadowEnabled ?? false),
    shadowColor: inputData.shadowColor || "#000000",
    shadowOpacity: Number(inputData.shadowOpacity ?? 0.5),
    shadowOffsetX: Number(inputData.shadowOffsetX ?? 2),
    shadowOffsetY: Number(inputData.shadowOffsetY ?? -2),
    shadowBlur: Number(inputData.shadowBlur ?? 5),
    ...inputData,
    overridden: Boolean(inputData.overridden ?? false)
  }),

  ShapeRenderer: (inputData = {}) => {
    let elements = Array.isArray(inputData.elements) ? inputData.elements : [];

    if (elements.length === 0) {
      const generateId = () => Math.random().toString(36).substring(2, 11);
      const p1 = `pt_${generateId()}`;
      const p2 = `pt_${generateId()}`;
      const p3 = `pt_${generateId()}`;
      const p4 = `pt_${generateId()}`;

      elements = [
        { id: p1, type: 'point', x: -50, y: -50, size: 6, enabled: true },
        { id: p2, type: 'point', x: 50, y: -50, size: 6, enabled: true },
        { id: p3, type: 'point', x: 50, y: 50, size: 6, enabled: true },
        { id: p4, type: 'point', x: -50, y: 50, size: 6, enabled: true },
        {
          id: `poly_${generateId()}`,
          type: 'polygon',
          points: [p1, p2, p3, p4],
          enabled: true
        }
      ];
    }

    return {
      type: "custom",
      opacity: Number(inputData.opacity ?? 1),
      isFilled: Boolean(inputData.isFilled ?? true),
      color: inputData.color || "#ff1e00",
      fillOpacity: Number(inputData.fillOpacity ?? 1),
      outlineWidth: Number(inputData.outlineWidth ?? 0),
      outlineColor: inputData.outlineColor || "#0066FF",
      outlineOpacity: Number(inputData.outlineOpacity ?? 1),
      elements,
      enablePolygonCollision: Boolean(inputData.enablePolygonCollision ?? false),
      enableSegmentCollision: Boolean(inputData.enableSegmentCollision ?? false),
      enableCircleCollision: Boolean(inputData.enableCircleCollision ?? false),
      ...inputData,
      overridden: Boolean(inputData.overridden ?? false)
    };
  },

  Tilemap: (inputData = {}) => ({
    width: Number(inputData.width ?? inputData.tileWidth ?? 16),
    height: Number(inputData.height ?? inputData.tileHeight ?? 16),
    assetId: inputData.assetId || null,
    opacity: Number(inputData.opacity ?? 1),
    isSolid: Boolean(inputData.isSolid ?? false),
    filterMode: inputData.filterMode || "pixelated",
    data: (inputData.data && typeof inputData.data === 'object' && !Array.isArray(inputData.data))
      ? inputData.data 
      : {},
    ...inputData,
    overridden: Boolean(inputData.overridden ?? false)
  }),

  ScriptController: (inputData = {}) => ({
    data: Array.isArray(inputData.data) ? inputData.data : [],
    ...inputData,
    overridden: Boolean(inputData.overridden ?? false)
  }),

  create: (type, data = {}) => {
    const factory = componentSchema[type];
    if (factory) {
      return factory(data);
    }
    return {
      ...data,
      overridden: Boolean(data.overridden ?? false)
    };
  }
};