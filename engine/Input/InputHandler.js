export default class InputHandler {
  constructor() {
    this.keys = {
      arrowleft: false,
      arrowright: false,
      arrowup: false,
      arrowdown: false,
    };

    this.keyMap = {
      a: "arrowleft",
      d: "arrowright",
      w: "arrowup",
      s: "arrowdown",
      arrowleft: "arrowleft",
      arrowright: "arrowright",
      arrowup: "arrowup",
      arrowdown: "arrowdown",
    };

    this.actions = { jump: false };

    this._pressedQueue = new Set();
    this._releasedQueue = new Set();

    this._pressedFrame = new Set();
    this._releasedFrame = new Set();

    this.actionMap = {
      w: "jump",
      " ": "jump",
      space: "jump",
      spacebar: "jump",
    };

    this.initListeners();
  }

  initListeners() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  handleKeyDown(e) {
    const k = (e.key || "").toLowerCase();
    if (this.keyMap[k]) this.keys[this.keyMap[k]] = true;

    const isSpace = e.code === "Space" || k === " " || k === "space" || k === "spacebar";
    if (this.actionMap[k] === "jump" || isSpace) {
      if (!this.actions.jump) this._pressedQueue.add("jump"); 
      this.actions.jump = true;
      if (isSpace) e.preventDefault();
    }
  }

  handleKeyUp(e) {
    const k = (e.key || "").toLowerCase();
    if (this.keyMap[k]) this.keys[this.keyMap[k]] = false;

    const isSpace = e.code === "Space" || k === " " || k === "space" || k === "spacebar";
    if (this.actionMap[k] === "jump" || isSpace) {
      if (this.actions.jump) this._releasedQueue.add("jump");
      this.actions.jump = false;
    }
  }

  beginFrame() {
    this._pressedFrame = this._pressedQueue;
    this._releasedFrame = this._releasedQueue;
    this._pressedQueue = new Set();
    this._releasedQueue = new Set();
  }

  getDirection() {
    const { arrowup, arrowdown, arrowleft, arrowright } = this.keys;
    let x = 0, y = 0;
    if (arrowup) y -= 1;
    if (arrowdown) y += 1;
    if (arrowleft) x -= 1;
    if (arrowright) x += 1;
    const len = Math.hypot(x, y);
    if (len > 0) { x /= len; y /= len; }
    let dir = null;
    if (Math.abs(x) > Math.abs(y)) dir = x > 0 ? "right" : "left";
    else if (Math.abs(y) > 0) dir = y > 0 ? "down" : "up";
    return { x, y, dir };
  }

  isPressedLate(name) {
    return this._pressedQueue.has(name);
  }
  consumePressedLate(name) {
    const had = this._pressedQueue.has(name);
    if (had) this._pressedQueue.delete(name);
    return had;
  }


  isDown(name)     { return !!this.actions[name]; }
  isPressed(name)  { return this._pressedFrame.has(name); }
  isReleased(name) { return this._releasedFrame.has(name); }
}
