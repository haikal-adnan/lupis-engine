export const createTransform = (data = {}, defaults = { width: 100, height: 100 }) => {
  return {
    x: Number(data.x ?? 0),
    y: Number(data.y ?? 0),
    rotation: Number(data.rotation ?? 0),
    scaleX: Number(data.scaleX ?? 1),
    scaleY: Number(data.scaleY ?? 1),
    pivotX: Number(data.pivotX ?? 0.5),
    pivotY: Number(data.pivotY ?? 0.5),
    width: Number(data.width ?? defaults.width),
    height: Number(data.height ?? defaults.height)
  };
};

// Parameter diganti jadi 'inputData' biar tidak rancu dengan properti 'data' di ScriptController
export const createComponent = (type, inputData = {}) => {
  switch (type) {
    case "SpriteRenderer":
      return {
        assetId: inputData.assetId || null,
        color: inputData.color || "#FFFFFF",
        flipX: inputData.flipX || false,
        flipY: inputData.flipY || false,
        source: inputData.source || { x: 0, y: 0, w: 100, h: 100 },
        opacity: Number(inputData.opacity ?? 1),
        ...inputData
      };

    case "TextRenderer":
      return {
        value: inputData.value || "New Text",
        fontSize: Number(inputData.fontSize || 24),
        color: inputData.color || "#FFFFFF",
        align: inputData.align || "left",
        assetId: inputData.assetId || null,
        opacity: Number(inputData.opacity ?? 1),
        ...inputData
      };

    case "ShapeRenderer":
      return {
        type: inputData.type || "rectangle",
        color: inputData.color || "#FF0000",
        width: Number(inputData.width || 100),
        height: Number(inputData.height || 100),
        thickness: Number(inputData.thickness || 1),
        opacity: Number(inputData.opacity ?? 1),
        ...inputData
      };

    case "Tilemap":
      const mapW = Number(inputData.width || 40);
      const mapH = Number(inputData.height || 30);

      return {
        tileWidth: Number(inputData.tileWidth || 16),
        tileHeight: Number(inputData.tileHeight || 16),
        width: mapW,
        height: mapH,
        assetId: inputData.assetId || null,
        opacity: Number(inputData.opacity ?? 1),
        isSolid: Boolean(inputData.isSolid ?? false),
        data: inputData.data || new Array(mapW * mapH).fill(0),
        ...inputData
      };

    case "ScriptController":
      return {
        data: Array.isArray(inputData.data) ? inputData.data : []
      };

    case "Transform":
      return createTransform(inputData);

    default:
      return { ...inputData };
  }
};