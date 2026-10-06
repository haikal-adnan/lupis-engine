export function computeGlobalTransform(entity, getEntityById) {
  if (!entity) return null;
  const t = entity.components?.Transform || entity.components?.UITransform;
  if (!t) return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5, width: 100, height: 100 };

  if (!entity.parentId) return { ...t, width: t.width, height: t.height };

  const parentEntity = getEntityById(entity.parentId);
  const parentGlobal = computeGlobalTransform(parentEntity, getEntityById);
  if (!parentGlobal) return { ...t, width: t.width, height: t.height };

  const rad = parentGlobal.rotation * (Math.PI / 180);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const sX = t.x * parentGlobal.scaleX;
  const sY = t.y * parentGlobal.scaleY;

  const rX = sX * cos - sY * sin;
  const rY = sX * sin + sY * cos;

  return {
    x: parentGlobal.x + rX,
    y: parentGlobal.y + rY,
    rotation: parentGlobal.rotation + (t.rotation || 0),
    scaleX: parentGlobal.scaleX * (t.scaleX ?? 1),
    scaleY: parentGlobal.scaleY * (t.scaleY ?? 1),
    pivotX: t.pivotX ?? 0.5,
    pivotY: t.pivotY ?? 0.5,
    width: t.width,
    height: t.height
  };
}