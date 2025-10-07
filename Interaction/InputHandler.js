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
    this.initListeners();
  }

  initListeners() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  handleKeyDown(e) {
    const k = e.key.toLowerCase();
    if (this.keyMap[k]) this.keys[this.keyMap[k]] = true;
  }

  handleKeyUp(e) {
    const k = e.key.toLowerCase();
    if (this.keyMap[k]) this.keys[this.keyMap[k]] = false;
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
}
