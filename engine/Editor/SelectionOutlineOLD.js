// import Config from "../Core/Config.js";
// import { bus } from "../Util/EventBus.js";

// export default class SelectionOutline {
//   constructor(world, game, canvas, renderer, input) {
//     this.world = world;
//     this.game = game;
//     this.canvas = canvas;
//     this.glRenderer = renderer;
//     this.input = input;

//     this.active = Config.ENGINE_MODE === "editor";

//     this.hovered = null;
//     this.selected = null;

//     this.isPointerDown = false;
//     this.selectedAtPointerDown = false;
//     this.isDragging = false;

//     this._lastCanvasW = 0;
//     this._lastCanvasH = 0;

//     if (this.active) this._ensureOverlay();

//     bus.on("entity:dragging", f => this.isDragging = f);
//   }

//   getBounding(ent) {
//     if (ent.shape?.type === "line") {
//       return {
//         x: ent.hitX,
//         y: ent.hitY,
//         w: ent.hitWidth,
//         h: ent.hitHeight
//       };
//     }

//     if (ent.components?.TextRenderer) {
//       return {
//         x: ent.hitX,
//         y: ent.hitY,
//         w: ent.hitWidth,
//         h: ent.hitHeight
//       };
//     }

//     return {
//       x: ent.x,
//       y: ent.y,
//       w: ent.width,
//       h: ent.height
//     };
//   }

//   update() {
//     if (!this.active) return;

//     const w = this.canvas.clientWidth;
//     const h = this.canvas.clientHeight;

//     if (w !== this._lastCanvasW || h !== this._lastCanvasH) {
//       this._lastCanvasW = w;
//       this._lastCanvasH = h;
//       this._ensureOverlay();
//     }

//     const mouse = this.input.mouse;
//     const touch = this.input.touch;

//     if (touch.active && touch.touches.length === 1) {
//       const t = touch.touches[0];
//       this._pointerMove(t.x, t.y);

//       if (!this.isPointerDown) {
//         this._pointerDown(t.x, t.y);
//         this.isPointerDown = true;
//       }
//       return;
//     }

//     if (touch.active && touch.touches.length > 1) {
//       this.hovered = null;
//       this.isPointerDown = false;
//       this.selectedAtPointerDown = false;
//       this.redraw();
//       return;
//     }

//     this._pointerMove(mouse.x, mouse.y);

//     if (mouse.isDown(0) && !this.isPointerDown) {
//       this._pointerDown(mouse.x, mouse.y);
//       this.isPointerDown = true;
//     }

//     if (!mouse.isDown(0) && this.isPointerDown) {
//       this.isPointerDown = false;
//       this.selectedAtPointerDown = false;
//     }
//   }

//   _ensureOverlay() {
//     const dpr = window.devicePixelRatio || 1;

//     if (!this._overlay) {
//       const c = document.createElement("canvas");
//       c.style.position = "absolute";
//       c.style.inset = 0;
//       c.style.pointerEvents = "none";

//       this.canvas.parentElement.appendChild(c);
//       this._overlay = c;
//       this.glRenderer.overlayCtx = c.getContext("2d");
//     }

//     const cssW = this.canvas.clientWidth;
//     const cssH = this.canvas.clientHeight;

//     this._overlay.width  = cssW * dpr;
//     this._overlay.height = cssH * dpr;

//     this._overlay.style.width  = cssW + "px";
//     this._overlay.style.height = cssH + "px";

//     this.redraw();
//   }

//   _pointerWorld(px, py) {
//     const cam = this.game.camera;
//     const s = cam.scale;

//     return {
//       x: cam.x + (px - this.canvas.width * 0.5) / s,
//       y: cam.y + (py - this.canvas.height * 0.5) / s
//     };
//   }

//   _pointerMove(px, py) {
//     if (this.isDragging) {
//       this.hovered = null;
//       return this.redraw();
//     }

//     const p = this._pointerWorld(px, py);
//     this.hovered = null;

//     for (const ent of this.world.entities) {
//       if (!ent.visible) continue;

//       const box = this.getBounding(ent);

//       if (p.x >= box.x && p.x <= box.x + box.w &&
//           p.y >= box.y && p.y <= box.y + box.h) {
//         if (this.selected && ent.id === this.selected.id) {
//           this.hovered = null;
//           return this.redraw();
//         }
//         this.hovered = ent;
//         break;
//       }
//     }

//     this.redraw();
//   }

//   _pointerDown(px, py) {
//     const p = this._pointerWorld(px, py);
//     let clicked = null;

//     for (const ent of this.world.entities) {
//       if (!ent.visible) continue;

//       const box = this.getBounding(ent);

//       if (p.x >= box.x && p.x <= box.x + box.w &&
//           p.y >= box.y && p.y <= box.y + box.h) {
//         clicked = ent;
//         break;
//       }
//     }

//     if (clicked && this.selected && clicked.id === this.selected.id) {
//       this.selectedAtPointerDown = true;
//       bus.emit("entity:selected", this.selected);
//       bus.emit("selection:pointer-down", { px, py });
//       return this.redraw();
//     }

//     if (clicked) {
//       this.selected = clicked;
//       this.selectedAtPointerDown = true;
//       bus.emit("entity:selected", clicked);
//     } else {
//       this.selected = null;
//       this.selectedAtPointerDown = false;
//       bus.emit("entity:deselected");
//     }

//     bus.emit("selection:pointer-down", { px, py });
//     this.redraw();
//   }

//   redraw() {
//     const ctx = this._overlay.getContext("2d");
//     if (!ctx) return;

//     const W = this._overlay.width;
//     const H = this._overlay.height;

//     const cam = this.game.camera;
//     const s = cam.scale;

//     ctx.clearRect(0, 0, W, H);

//     const draw = (ent, col, lw) => {
//       const box = this.getBounding(ent);

//       const sx = (box.x - cam.x) * s + W * 0.5;
//       const sy = (box.y - cam.y) * s + H * 0.5;

//       ctx.save();
//       ctx.strokeStyle = col;
//       ctx.lineWidth = lw;
//       ctx.strokeRect(sx, sy, box.w * s, box.h * s);
//       ctx.restore();
//     };

//     if (this.selected) draw(this.selected, "rgba(255,215,0,1)", 2);
//     if (this.hovered)  draw(this.hovered,  "rgba(0,255,0,0.75)", 1.5);
//   }
// }
