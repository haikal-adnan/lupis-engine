// Helper untuk Transform standar (World Space)
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

// Helper khusus untuk UI Transform (Screen Space)
export const createUITransform = (data = {}) => {
  return {
    ...createTransform(data, { width: 160, height: 40 }), // Default size lebih pas untuk UI
    /**
     * Anchor menentukan posisi relatif terhadap layar/parent.
     * Pilihan: 'top-left', 'top-center', 'top-right', 
     * 'center-left', 'center', 'center-right',
     * 'bottom-left', 'bottom-center', 'bottom-right'
     */
    anchor: data.anchor || "center",
    // Margin/Padding jika diperlukan untuk offset dari anchor
    marginLeft: Number(data.marginLeft ?? 0),
    marginTop: Number(data.marginTop ?? 0)
  };
};

export const createComponent = (type, inputData = {}) => {
  switch (type) {
    // --- UI COMPONENTS ---
    
    case "UITransform":
      return createUITransform(inputData);

    case "UIButton":
      return {
        text: inputData.text || "Button",
        fontSize: Number(inputData.fontSize || 14),
        textColor: inputData.textColor || "#FFFFFF",
        normalColor: inputData.normalColor || "#3b82f6",
        hoverColor: inputData.hoverColor || "#2563eb",
        pressedColor: inputData.pressedColor || "#1d4ed8",
        interactable: Boolean(inputData.interactable ?? true),
        // Nama event yang akan dipicu di visual scripting/engine
        onClickEvent: inputData.onClickEvent || null, 
        ...inputData
      };

    // --- WORLD COMPONENTS ---

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