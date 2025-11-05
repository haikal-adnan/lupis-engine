export default class TouchHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.touchX = 0;
    this.touchY = 0;
    this.dragging = false;
    this.onTouchDown = this.onTouchDown.bind(this);
    this.onTouchUp = this.onTouchUp.bind(this);
    this.handleMoveEvent = this.handleMoveEvent.bind(this);
    this.initListeners();
  }

  initListeners() {
    const opt = { passive: false };
    ["pointerdown", "pointermove", "pointerup", "pointerleave"].forEach(e =>
      document.addEventListener(e, this[e === "pointermove" ? "handleMoveEvent" : e === "pointerdown" ? "onTouchDown" : "onTouchUp"], opt)
    );
    ["touchstart", "touchmove", "touchend", "touchcancel"].forEach(e =>
      document.addEventListener(e, this[e === "touchmove" ? "handleMoveEvent" : e === "touchstart" ? "onTouchDown" : "onTouchUp"], opt)
    );
  }

  onTouchDown(e) {
    e.preventDefault();
    this.touchCoordinate(e);
    this.dragging = true;
  }

  onTouchUp(e) {
    e.preventDefault();
    this.dragging = false;
  }

  handleMoveEvent(e) {
    if (this.dragging) this.touchCoordinate(e);
  }

  touchCoordinate(e) {
    const canvas = document.getElementById("glCanvas");
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      this.touchX = e.touches[0].clientX - rect.left;
      this.touchY = e.touches[0].clientY - rect.top;
    } else {
      this.touchX = e.clientX - rect.left;
      this.touchY = e.clientY - rect.top;
    }

    const cAspect = canvas.width / canvas.height;
    const sAspect = window.innerWidth / window.innerHeight;
    let offsetX = 0, offsetY = 0, scaleX = 1, scaleY = 1;

    if (sAspect > cAspect) {
      const actualW = window.innerHeight * cAspect;
      offsetX = (window.innerWidth - actualW) / 2;
      scaleX = canvas.width / actualW;
      scaleY = canvas.height / window.innerHeight;
    } else {
      const actualH = window.innerWidth / cAspect;
      offsetY = (window.innerHeight - actualH) / 2;
      scaleX = canvas.width / window.innerWidth;
      scaleY = canvas.height / actualH;
    }

    this.touchX = (this.touchX - offsetX) * scaleX;
    this.touchY = (this.touchY - offsetY) * scaleY;
    this.touchX = Math.max(0, Math.min(canvas.width, this.touchX));
    this.touchY = Math.max(0, Math.min(canvas.height, this.touchY));
  }
}