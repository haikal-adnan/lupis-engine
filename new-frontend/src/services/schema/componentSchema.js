export const createTransform = (data = {}, defaults = { width: 100, height: 100 }) => {
  const tx = data.translate?.x ?? data.x ?? 0;
  const ty = data.translate?.y ?? data.y ?? 0;
  const sx = data.scale?.x ?? data.scaleX ?? 1;
  const sy = data.scale?.y ?? data.scaleY ?? 1;
  const px = data.pivot?.x ?? data.pivotX ?? 0.5;
  const py = data.pivot?.y ?? data.pivotY ?? 0.5;

  return {
    x: Number(tx),
    y: Number(ty),
    rotation: Number(data.rotation ?? 0),
    scaleX: Number(sx),
    scaleY: Number(sy),
    pivotX: Number(px),
    pivotY: Number(py),
    width: Number(data.width ?? defaults.width),
    height: Number(data.height ?? defaults.height)
  };
};

export const createComponent = (type, data = {}) => {
  switch (type) {
    case "SpriteRenderer":
      return {
        assetId: data.assetId || null,
        color: data.color || "#FFFFFF",
        flipX: data.flipX || false,
        flipY: data.flipY || false,
        source: data.source || null,
        opacity: Number(data.opacity ?? 1),
        ...data
      };

    case "TextRenderer":
      return {
        value: data.value || "New Text",
        fontSize: Number(data.fontSize || 24),
        color: data.color || "#FFFFFF",
        align: data.align || "left",
        assetId: data.assetId || null,
        opacity: Number(data.opacity ?? 1),
        ...data
      };

    case "ShapeRenderer":
      return {
        type: data.type || "rectangle",
        color: data.color || "#FF0000",
        width: Number(data.width || 100),
        height: Number(data.height || 100),
        thickness: Number(data.thickness || 1),
        opacity: Number(data.opacity ?? 1),
        ...data
      };

    case "Transform":
      return createTransform(data);

    default:
      return { ...data };
  }
};