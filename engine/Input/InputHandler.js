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

    // aksi
    this.actions = { jump: false };

    // event yang datang di antara frame
    this._pressedQueue = new Set();
    this._releasedQueue = new Set();

    // event yang hanya berlaku di frame ini
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
      if (!this.actions.jump) this._pressedQueue.add("jump"); // dicatat untuk frame berikutnya
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

  // Panggil SEKALI di awal tiap frame
  beginFrame() {
    this._pressedFrame = this._pressedQueue;
    this._releasedFrame = this._releasedQueue;
    this._pressedQueue = new Set();
    this._releasedQueue = new Set();
  }

  // arah (untuk gerak horizontal/vertikal)
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

  // Tambahan di kelas InputHandler
  isPressedLate(name) {
    // true kalau tombol ditekan setelah beginFrame() di frame ini
    return this._pressedQueue.has(name);
  }
  consumePressedLate(name) {
    // optional kalau mau mengonsumsi eventnya
    const had = this._pressedQueue.has(name);
    if (had) this._pressedQueue.delete(name);
    return had;
  }


  // state/edge untuk frame ini saja (no buffer)
  isDown(name)     { return !!this.actions[name]; }
  isPressed(name)  { return this._pressedFrame.has(name); }
  isReleased(name) { return this._releasedFrame.has(name); }
}
