export const createTransform = (data = {}, defaults = { width: 100, height: 100 }) => {
  return {
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
  };
};

export const createAudio = (data = {}) => {
  return {
    currentClip: data.currentClip || null,
    clips: Array.isArray(data.clips) ? data.clips : [],
    ...data,
    overridden: Boolean(data.overridden ?? false)
  };
};

export const createUITransform = (data = {}, defaults = { width: 160, height: 40 }) => {
  const base = createTransform(data, defaults);
  return {
    ...base,
    anchorX: Number(data.anchorX ?? 0.5),
    anchorY: Number(data.anchorY ?? 0.5),
    overridden: Boolean(data.overridden ?? false)
  };
};

export const createCollider = (data = {}) => {
  return {
    data: Array.isArray(data.data) ? data.data : [{
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
  };
};

export const createPhysics = (data = {}) => {
  return {
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
  };
};

export const createSpriteAnimator = (data = {}) => {
  return {
    currentClip: data.currentClip || null,
    clips: data.clips || {},
    active: Boolean(data.active ?? true),
    isPlaying: Boolean(data.isPlaying ?? true),
  }
};

export const createComponent = (type, inputData = {}) => {
  let specificData = {};

  switch (type) {
    case "SpriteRenderer":
      specificData = {
        assetId: inputData.assetId || null,
        sourceX: Number(inputData.sourceX ?? 0),
        sourceY: Number(inputData.sourceY ?? 0),
        sourceWidth: Number(inputData.sourceWidth ?? 100),
        sourceHeight: Number(inputData.sourceHeight ?? 100),
        color: inputData.color || "#FFFFFF",
        opacity: Number(inputData.opacity ?? 1),
        filterMode: inputData.filterMode || "pixelated", 
        useSDF: Boolean(inputData.useSDF ?? false),
        ...inputData
      };
      break;

    case "TextRenderer":
      specificData = {
        value: inputData.value || "New Text",
        mode: inputData.mode || "static",
        assetId: inputData.assetId || null,
        
        fontSize: Number(inputData.fontSize ?? 24),
        color: inputData.color || "#FFFFFF",
        opacity: Number(inputData.opacity ?? 1),
        
        align: inputData.align || "left", 
        maxWidth: Number(inputData.maxWidth ?? 0),
        maxLine: Number(inputData.maxLine ?? 0),
        lineSpacing: Number(inputData.lineSpacing ?? 1.2),
        letterSpacing: Number(inputData.letterSpacing ?? 0),
        overflow: inputData.overflow || "wrap",
        autoFit: Boolean(inputData.autoFit ?? true),

        smoothing: Number(inputData.smoothing ?? 0.5),
        bias: Number(inputData.bias ?? 0), 
        outlineWidth: Number(inputData.outlineWidth ?? 0),
        outlineColor: inputData.outlineColor || "#000000",

        shadowEnabled: Boolean(inputData.shadowEnabled ?? false),
        shadowColor: inputData.shadowColor || "#000000",
        shadowOpacity: Number(inputData.shadowOpacity ?? 0.5),
        shadowOffsetX: Number(inputData.shadowOffsetX ?? 2),
        shadowOffsetY: Number(inputData.shadowOffsetY ?? -2),
        shadowBlur: Number(inputData.shadowBlur ?? 5),

        ...inputData
      };
      break;

    case "ShapeRenderer": {
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

      specificData = {
        type: "custom",
        opacity: Number(inputData.opacity ?? 1),
        isFilled: Boolean(inputData.isFilled ?? true),
        color: inputData.color || "#ff1e00",
        fillOpacity: Number(inputData.fillOpacity ?? 1),
        outlineWidth: Number(inputData.outlineWidth ?? 0),
        outlineColor: inputData.outlineColor || "#0066FF",
        outlineOpacity: Number(inputData.outlineOpacity ?? 1),
        
        elements: elements,
        enablePolygonCollision: Boolean(inputData.enablePolygonCollision ?? false),
        enableSegmentCollision: Boolean(inputData.enableSegmentCollision ?? false),
        enableCircleCollision: Boolean(inputData.enableCircleCollision ?? false),
        ...inputData,
      };
      break;
    }

    case "Tilemap":
      const mapW = Number(inputData.width || 40);
      const mapH = Number(inputData.height || 30);
      specificData = {
        tileWidth: Number(inputData.tileWidth || 16),
        tileHeight: Number(inputData.tileHeight || 16),
        width: mapW,
        height: mapH,
        assetId: inputData.assetId || null,
        opacity: Number(inputData.opacity ?? 1),
        isSolid: Boolean(inputData.isSolid ?? false),
        autoFit: Boolean(inputData.autoFit ?? true),
        
        filterMode: inputData.filterMode || "pixelated",

        data: inputData.data || new Array(mapW * mapH).fill(0),
        ...inputData
      };
      break;

    case "ScriptController":
      specificData = {
        data: Array.isArray(inputData.data) ? inputData.data : []
      };
      break;

    case "Transform":
      return createTransform(inputData);

    case "UITransform":
      return createUITransform(inputData);

    case "Collider":
      return createCollider(inputData);

    case "Physics":
      return createPhysics(inputData);

    case "SpriteAnimator":
      return createSpriteAnimator(inputData);

    case "Audio":
      return createAudio(inputData);

    default:
      specificData = { ...inputData };
      break;
  }

  return {
    ...specificData,
    overridden: Boolean(inputData.overridden ?? false)
  };
};