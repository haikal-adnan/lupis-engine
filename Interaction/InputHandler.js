export default class InputHandler {
  constructor() {
    this.keys = {
      arrowleft: false,
      arrowright: false,
      arrowup: false,
      arrowdown: false,
    };

    // arah (untuk getDirection)
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

    // aksi (jump, dsb)
    this.actions = { jump: false };
    this._pressed = new Set();   // edge: baru ditekan
    this._released = new Set();  // edge: baru dilepas

    // pemetaan tombol → aksi
    this.actionMap = {
      w: "jump",       // boleh pakai W untuk jump
      " ": "jump",     // e.key === " "
      space: "jump",   // beberapa browser lama
      spacebar: "jump" // sangat lama
    };

    this.initListeners();
  }

  initListeners() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  handleKeyDown(e) {
    const k = (e.key || "").toLowerCase();

    // arah
    if (this.keyMap[k]) this.keys[this.keyMap[k]] = true;

    // aksi jump (juga cover e.code === "Space")
    const isSpace = e.code === "Space" || k === " " || k === "space" || k === "spacebar";
    if (this.actionMap[k] === "jump" || isSpace) {
      if (!this.actions.jump) this._pressed.add("jump"); // edge
      this.actions.jump = true;
      if (isSpace) e.preventDefault(); // cegah scroll
    }
  }

  handleKeyUp(e) {
    const k = (e.key || "").toLowerCase();

    // arah
    if (this.keyMap[k]) this.keys[this.keyMap[k]] = false;

    // aksi jump
    const isSpace = e.code === "Space" || k === " " || k === "space" || k === "spacebar";
    if (this.actionMap[k] === "jump" || isSpace) {
      if (this.actions.jump) this._released.add("jump"); // edge
      this.actions.jump = false;
    }
  }

  // arah normal (untuk platformer: hanya pakai X)
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

  // helpers aksi
  isDown(name)     { return !!this.actions[name]; }
  isPressed(name)  { const ok = this._pressed.has(name);  if (ok) this._pressed.delete(name);  return ok; }
  isReleased(name) { const ok = this._released.has(name); if (ok) this._released.delete(name); return ok; }
}
