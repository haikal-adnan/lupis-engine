export class CameraContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade() {
    const game = this.game;
    const camera = game?.camera;

    return {
      follow: (targetEntity, speed = 0.1, offset = { x: 0, y: 0 }) => {
        camera?.setTarget(targetEntity, speed, offset);
      },
      stopFollow: () => {
        camera?.clearTarget();
      },
      setTarget: (targetEntity, speed = 0.1, offset = { x: 0, y: 0 }) => {
        camera?.setTarget(targetEntity, speed, offset);
      },
      clearTarget: () => {
        camera?.clearTarget();
      },
      snapTo: (x, y) => {
        camera?.snapTo(x, y);
      },
      setTransform: (x, y, scale, speed) => {
        camera?.snapTo(x, y);
        if (scale !== undefined && camera) camera.scale = scale;
        if (speed !== undefined && camera) camera.lerp = speed;
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
      set x(val) { if (camera) camera.x = val; },
      get y() { return camera?.y; },
      set y(val) { if (camera) camera.y = val; },
      get scale() { return camera?.scale; },
      set scale(val) { if (camera) camera.scale = val; },
      get lerp() { return camera?.lerp; },
      set lerp(val) { if (camera) camera.lerp = val; },
      get target() { return camera?.target; }
    };
  }
}
