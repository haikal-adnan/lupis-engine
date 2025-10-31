export function clampEntityToBounds(entity, boundW, boundH, opts = {}) {
  const pad = opts.pad ?? 0;

  const w = (entity.w ?? entity.width ?? 0);
  const h = (entity.h ?? entity.height ?? 0);

  const minX = Math.ceil(pad);
  const minY = Math.ceil(pad);
  const maxX = Math.max(minX, Math.floor(boundW - pad - w));
  const maxY = Math.max(minY, Math.floor(boundH - pad - h));

  let hitLeft = false, hitRight = false, hitTop = false, hitBottom = false;

  // X axis
  if (entity.x < minX) {
    entity.x = minX; hitLeft = true;
    if ("vx" in entity && entity.vx < 0) entity.vx = 0;
  } else if (entity.x > maxX) {
    entity.x = maxX; hitRight = true;
    if ("vx" in entity && entity.vx > 0) entity.vx = 0;
  }

  // Y axis
  if (entity.y < minY) {
    entity.y = minY; hitTop = true;
    if ("vy" in entity && entity.vy < 0) entity.vy = 0;
  } else if (entity.y > maxY) {
    entity.y = maxY; hitBottom = true;
    if ("vy" in entity && entity.vy > 0) entity.vy = 0;
  }

  entity._collideWorld = { left: hitLeft, right: hitRight, top: hitTop, bottom: hitBottom };
  return entity._collideWorld;
}
