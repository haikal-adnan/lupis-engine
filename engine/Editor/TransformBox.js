// import { ApplyResizeToEntity } from "../Util/ApplyResizeToEntity.js";

// export default class TransformBox {
//     constructor(world, game, canvas, renderer, input, selection, opts = {}) {
//         this.world = world;
//         this.game = game;
//         this.canvas = canvas;
//         this.renderer = renderer;
//         this.input = input;
//         this.selection = selection;

//         this.uniformResize = false;

//         this.active = true;
//         this.dragging = false;
//         this.dragType = null;

//         this.handles = [];
//         this.hoverHandle = null;

//         this.startX = 0;
//         this.startY = 0;

//         this.entStart = null;

//         this._ensureOverlay();
//     }

//     update() {
//         const ent = this.selection.selected;
//         if (!ent) {
//             this._clearOverlay();
//             return;
//         }

//         this._computeHandles(ent);
//         this._render();
//         this._processInput(ent);
//     }

//     _ensureOverlay() {
//         const c = document.createElement("canvas");
//         c.style.position = "absolute";
//         c.style.inset = 0;
//         c.style.pointerEvents = "none";

//         this.canvas.parentElement.appendChild(c);
//         this.overlay = c;
//         this.ctx = c.getContext("2d");

//         this._resize();
//         window.addEventListener("resize", () => this._resize());
//     }

//     _resize() {
//         const dpr = window.devicePixelRatio || 1;
//         const w = this.canvas.clientWidth;
//         const h = this.canvas.clientHeight;

//         this.overlay.width = w * dpr;
//         this.overlay.height = h * dpr;
//         this.overlay.style.width = w + "px";
//         this.overlay.style.height = h + "px";
//     }

//     _pointerWorld(px, py) {
//         const cam = this.game.camera;
//         const s = cam.scale;
//         const W = this.overlay.width;
//         const H = this.overlay.height;

//         return {
//             x: cam.x + (px - W * 0.5) / s,
//             y: cam.y + (py - H * 0.5) / s
//         };
//     }

//     _computeHandles(ent) {
//         const box = this.selection.getBounding(ent);

//         const cam = this.game.camera;
//         const s = cam.scale;
//         const W = this.overlay.width;
//         const H = this.overlay.height;

//         const x = (box.x - cam.x) * s + W * 0.5;
//         const y = (box.y - cam.y) * s + H * 0.5;
//         const w = box.w * s;
//         const h = box.h * s;

//         this.handles = [
//             { type: "nw", x: x,     y: y     },
//             { type: "ne", x: x + w, y: y     },
//             { type: "sw", x: x,     y: y + h },
//             { type: "se", x: x + w, y: y + h }
//         ];
//     }

//     _render() {
//         const ctx = this.ctx;
//         if (!ctx) return;

//         const W = this.overlay.width;
//         const H = this.overlay.height;

//         ctx.clearRect(0, 0, W, H);

//         const ent = this.selection.selected;
//         if (!ent) return;

//         const box = this.selection.getBounding(ent);

//         const cam = this.game.camera;
//         const s = cam.scale;

//         const x = (box.x - cam.x) * s + W * 0.5;
//         const y = (box.y - cam.y) * s + H * 0.5;
//         const w = box.w * s;
//         const h = box.h * s;

//         ctx.save();
//         ctx.fillStyle = "#fff";
//         ctx.strokeStyle = "#000";
//         ctx.lineWidth = 2;

//         for (const hdl of this.handles) {
//             ctx.beginPath();
//             ctx.arc(hdl.x, hdl.y, 6 * s, 0, Math.PI * 2);
//             ctx.fill();
//             ctx.stroke();
//         }
//         ctx.restore();
//     }

//     _updateHover(px, py) {
//         const dpr = window.devicePixelRatio || 1;
//         const cx = px * dpr;
//         const cy = py * dpr;

//         const RESIZE_HIT = 28 * dpr;

//         this.hoverHandle = null;

//         for (const h of this.handles) {
//             const dx = cx - h.x;
//             const dy = cy - h.y;
//             if (dx * dx + dy * dy <= RESIZE_HIT * RESIZE_HIT) {
//                 this.hoverHandle = h;
//                 break;
//             }
//         }

//         const map = {
//             nw: "nwse-resize",
//             ne: "nesw-resize",
//             sw: "nesw-resize",
//             se: "nwse-resize",
//         };

//         this.canvas.style.cursor = this.hoverHandle
//             ? map[this.hoverHandle.type]
//             : "default";
//     }

//     _processInput(ent) {
//         const mouse = this.input.mouse;

//         const px = mouse.x;
//         const py = mouse.y;

//         if (!this.dragging) {
//             this._updateHover(px, py);

//             if (mouse.isDown(0) && this.hoverHandle) {
//                 const box = this.selection.getBounding(ent);

//                 this.dragging = true;
//                 this.dragType = this.hoverHandle.type;

//                 this.startX = px;
//                 this.startY = py;

//                 this.entStart = {
//                     x: box.x,
//                     y: box.y,
//                     w: box.w,
//                     h: box.h
//                 };
//             }
//         }

//         if (this.dragging) {
//             if (!mouse.isDown(0)) {
//                 this.dragging = false;
//                 this.dragType = null;
//                 return;
//             }

//             this._applyTransform(px, py);
//         }
//     }

//     _applyTransform(px, py) {
//         const ent = this.selection.selected;
//         if (!ent) return;

//         const p  = this._pointerWorld(px, py);
//         const s0 = this._pointerWorld(this.startX, this.startY);

//         const dx = p.x - s0.x;
//         const dy = p.y - s0.y;

//         let newX = this.entStart.x;
//         let newY = this.entStart.y;
//         let newW = this.entStart.w;
//         let newH = this.entStart.h;

//         if (this.dragType === "nw") {
//             newX = this.entStart.x + dx;
//             newY = this.entStart.y + dy;
//             newW = this.entStart.w - dx;
//             newH = this.entStart.h - dy;
//         }
//         if (this.dragType === "ne") {
//             newY = this.entStart.y + dy;
//             newW = this.entStart.w + dx;
//             newH = this.entStart.h - dy;
//         }
//         if (this.dragType === "sw") {
//             newX = this.entStart.x + dx;
//             newW = this.entStart.w - dx;
//             newH = this.entStart.h + dy;
//         }
//         if (this.dragType === "se") {
//             newW = this.entStart.w + dx;
//             newH = this.entStart.h + dy;
//         }

//         if (this.uniformResize) {
//             const ratio = this.entStart.w / this.entStart.h;
//             const mag = Math.max(Math.abs(newW), Math.abs(newH));

//             if (this.dragType === "nw") {
//                 newW = mag;
//                 newH = mag / ratio;
//                 newX = this.entStart.x + (this.entStart.w - newW);
//                 newY = this.entStart.y + (this.entStart.h - newH);
//             }

//             if (this.dragType === "ne") {
//                 newW = mag;
//                 newH = mag / ratio;
//                 newY = this.entStart.y + (this.entStart.h - newH);
//             }

//             if (this.dragType === "sw") {
//                 newW = mag;
//                 newH = mag / ratio;
//                 newX = this.entStart.x + (this.entStart.w - newW);
//             }

//             if (this.dragType === "se") {
//                 newW = mag;
//                 newH = mag / ratio;
//             }
//         }

//         ent.x = newX;
//         ent.y = newY;
//         ent.width  = newW;
//         ent.height = newH;

//         ApplyResizeToEntity(ent, this.world);
//     }

//     _clearOverlay() {
//         if (!this.ctx) return;
//         this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
//     }
// }
