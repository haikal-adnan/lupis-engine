export class CameraContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade() {
    const game = this.game;
    const camera = game?.camera;

    return {
      follow: (targetEntity, speed, offset = { x: 0, y: 0 }) => {
        const effectiveSpeed = (typeof speed === 'number' && !isNaN(speed)) ? speed : (camera?.defaultLerp ?? camera?.lerp ?? 0.1);
        camera?.setTarget(targetEntity, effectiveSpeed, offset);
      },
      stopFollow: () => {
        camera?.clearTarget();
      },
      setTarget: (targetEntity, speed, offset = { x: 0, y: 0 }) => {
        const effectiveSpeed = (typeof speed === 'number' && !isNaN(speed)) ? speed : (camera?.defaultLerp ?? camera?.lerp ?? 0.1);
        camera?.setTarget(targetEntity, effectiveSpeed, offset);
      },
      clearTarget: () => {
        camera?.clearTarget();
      },
      snapTo: (x, y) => {
        camera?.snapTo(x, y);
      },
      setTransform: (x, y, scale, speed) => {
        camera?.snapTo(x, y);
        if (scale !== undefined && typeof scale === 'number' && !isNaN(scale) && scale > 0 && camera) camera.scale = scale;
        if (speed !== undefined && typeof speed === 'number' && !isNaN(speed) && camera) {
          camera.lerp = speed;
          camera.defaultLerp = speed;
        }
      },
      getInfo: () => ({
        x: camera?.x || 0,
        y: camera?.y || 0,
        scale: camera?.scale ?? 1,
        smoothSpeed: camera?.lerp ?? 0.1,
        targetEntity: camera?.target?.scriptId || '',
        hasTarget: Boolean(camera?.target)
      }),
      get x() { return camera?.x; },
      set x(val) { if (camera && typeof val === 'number' && !isNaN(val)) camera.x = val; },
      get y() { return camera?.y; },
      set y(val) { if (camera && typeof val === 'number' && !isNaN(val)) camera.y = val; },
      get scale() { return camera?.scale; },
      set scale(val) { if (camera && typeof val === 'number' && !isNaN(val) && val > 0) camera.scale = val; },
      get lerp() { return camera?.lerp; },
      set lerp(val) { if (camera && typeof val === 'number' && !isNaN(val)) { camera.lerp = val; camera.defaultLerp = val; } },
      get target() { return camera?.target; }
    };
  }
}
