export function computeGlobalTransform(entity, getEntityById, uiSettings = { width: 1920, height: 1080 }) {
  if (!entity) return null;
  const isUI = Boolean(entity.components?.UITransform);
  const t = entity.components?.Transform || entity.components?.UITransform;
  if (!t) return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5, width: 100, height: 100 };

  const localX = t.x ?? 0;
  const localY = t.y ?? 0;
  const localRot = t.rotation ?? 0;
  const localScaleX = t.scaleX ?? 1;
  const localScaleY = t.scaleY ?? 1;
  const pivotX = t.pivotX ?? 0.5;
  const pivotY = t.pivotY ?? 0.5;
  const width = t.width ?? 0;
  const height = t.height ?? 0;

  const canvasW = uiSettings?.width ?? 1920;
  const canvasH = uiSettings?.height ?? 1080;

  if (!entity.parentId) {
    let x = localX;
    let y = localY;
    if (isUI) {
      const anchorX = t.anchorX ?? 0.5;
      const anchorY = t.anchorY ?? 0.5;
      x = (canvasW * anchorX) + localX;
      y = (canvasH * anchorY) + localY;
    }
    return {
      ...t,
      x,
      y,
      rotation: localRot,
      scaleX: localScaleX,
      scaleY: localScaleY,
      pivotX,
      pivotY,
      width,
      height,
      anchorX: t.anchorX ?? 0.5,
      anchorY: t.anchorY ?? 0.5,
      isUI
    };
  }

  const parentEntity = getEntityById(entity.parentId);
  const parentGlobal = computeGlobalTransform(parentEntity, getEntityById, uiSettings);
  if (!parentGlobal) {
    let x = localX;
    let y = localY;
    if (isUI) {
      const anchorX = t.anchorX ?? 0.5;
      const anchorY = t.anchorY ?? 0.5;
      x = (canvasW * anchorX) + localX;
      y = (canvasH * anchorY) + localY;
    }
    return {
      ...t,
      x,
      y,
      rotation: localRot,
      scaleX: localScaleX,
      scaleY: localScaleY,
      pivotX,
      pivotY,
      width,
      height,
      anchorX: t.anchorX ?? 0.5,
      anchorY: t.anchorY ?? 0.5,
      isUI
    };
  }

  let anchorOffsetX = 0;
  let anchorOffsetY = 0;

  if (isUI) {
    const anchorX = t.anchorX ?? 0.5;
    const anchorY = t.anchorY ?? 0.5;
    const parentW = parentGlobal.width || 0;
    const parentH = parentGlobal.height || 0;
    const parentPivotX = parentGlobal.pivotX ?? 0.5;
    const parentPivotY = parentGlobal.pivotY ?? 0.5;

    const childW = width || 0;
    const childH = height || 0;
    const childPivotX = pivotX ?? 0.5;
    const childPivotY = pivotY ?? 0.5;

    anchorOffsetX = parentW * (anchorX - parentPivotX) + childW * (childPivotX - anchorX);
    anchorOffsetY = parentH * (anchorY - parentPivotY) + childH * (childPivotY - anchorY);
  }

  const localPosWithAnchorX = anchorOffsetX + localX;
  const localPosWithAnchorY = anchorOffsetY + localY;

  const parentRot = parentGlobal.rotation ?? 0;
  const parentScaleX = parentGlobal.scaleX ?? 1;
  const parentScaleY = parentGlobal.scaleY ?? 1;

  const rad = parentRot * (Math.PI / 180);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const sX = localPosWithAnchorX * parentScaleX;
  const sY = localPosWithAnchorY * parentScaleY;

  const rX = sX * cos - sY * sin;
  const rY = sX * sin + sY * cos;

  return {
    ...t,
    x: (parentGlobal.x ?? 0) + rX,
    y: (parentGlobal.y ?? 0) + rY,
    rotation: parentRot + localRot,
    scaleX: parentScaleX * localScaleX,
    scaleY: parentScaleY * localScaleY,
    pivotX,
    pivotY,
    width,
    height,
    anchorX: t.anchorX ?? 0.5,
    anchorY: t.anchorY ?? 0.5,
    isUI
  };
}

export function worldToLocalTransform(worldTransform, parentGlobalTransform, childEntityOrTransform = null, uiSettings = { width: 1920, height: 1080 }) {
  const wX = worldTransform?.x ?? 0;
  const wY = worldTransform?.y ?? 0;
  const wRot = worldTransform?.rotation ?? 0;
  const wScaleX = worldTransform?.scaleX ?? 1;
  const wScaleY = worldTransform?.scaleY ?? 1;

  const childT = childEntityOrTransform?.components?.UITransform 
    || childEntityOrTransform?.components?.Transform 
    || childEntityOrTransform;
  const isUI = Boolean(childEntityOrTransform?.components?.UITransform || (childT && childT.anchorX !== undefined));

  if (!parentGlobalTransform) {
    let localX = wX;
    let localY = wY;
    if (isUI) {
      const canvasW = uiSettings?.width ?? 1920;
      const canvasH = uiSettings?.height ?? 1080;
      const anchorX = childT?.anchorX ?? 0.5;
      const anchorY = childT?.anchorY ?? 0.5;
      localX = wX - (canvasW * anchorX);
      localY = wY - (canvasH * anchorY);
    }
    return {
      x: localX,
      y: localY,
      rotation: wRot,
      scaleX: wScaleX,
      scaleY: wScaleY
    };
  }

  const pX = parentGlobalTransform.x ?? 0;
  const pY = parentGlobalTransform.y ?? 0;
  const pRot = parentGlobalTransform.rotation ?? 0;
  const pScaleX = parentGlobalTransform.scaleX ?? 1;
  const pScaleY = parentGlobalTransform.scaleY ?? 1;

  const dx = wX - pX;
  const dy = wY - pY;

  const pRotRad = pRot * (Math.PI / 180);
  const cos = Math.cos(-pRotRad);
  const sin = Math.sin(-pRotRad);

  const unrotatedX = dx * cos - dy * sin;
  const unrotatedY = dx * sin + dy * cos;

  const totalLocalX = unrotatedX / (pScaleX || 1);
  const totalLocalY = unrotatedY / (pScaleY || 1);
  const localRotation = wRot - pRot;
  const localScaleX = wScaleX / (pScaleX || 1);
  const localScaleY = wScaleY / (pScaleY || 1);

  let anchorOffsetX = 0;
  let anchorOffsetY = 0;

  if (isUI) {
    const anchorX = childT?.anchorX ?? 0.5;
    const anchorY = childT?.anchorY ?? 0.5;
    const parentW = parentGlobalTransform.width || 0;
    const parentH = parentGlobalTransform.height || 0;
    const parentPivotX = parentGlobalTransform.pivotX ?? 0.5;
    const parentPivotY = parentGlobalTransform.pivotY ?? 0.5;

    const childW = childT?.width || 0;
    const childH = childT?.height || 0;
    const childPivotX = childT?.pivotX ?? 0.5;
    const childPivotY = childT?.pivotY ?? 0.5;

    anchorOffsetX = parentW * (anchorX - parentPivotX) + childW * (childPivotX - anchorX);
    anchorOffsetY = parentH * (anchorY - parentPivotY) + childH * (childPivotY - anchorY);
  }

  return {
    x: totalLocalX - anchorOffsetX,
    y: totalLocalY - anchorOffsetY,
    rotation: localRotation,
    scaleX: localScaleX,
    scaleY: localScaleY
  };
}