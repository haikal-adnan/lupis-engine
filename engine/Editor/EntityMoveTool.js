// import { bus } from "../Util/EventBus.js";
// import Config from "../Core/Config.js";

// export default class EntityMoveTool {
//     constructor(world, game, canvas, input, selection) {
//         this.world = world;
//         this.game = game;
//         this.canvas = canvas;
//         this.input = input;
//         this.selection = selection;

//         this.dragging = false;
//         this.startX = 0;
//         this.startY = 0;
//         this.entStartX = 0;
//         this.entStartY = 0;

//         this.pointerDown = false;
//         this.lastTouchCount = 0;

//         this.active = Config.ENGINE_MODE === "editor";
//     }

//     update() {
//         if (!this.active) return;

//         const mouse = this.input.mouse;
//         const touch = this.input.touch;

//         const touchCount = touch.active ? touch.touches.length : 0;

//         if (touchCount === 1) {
//             const t = touch.touches[0];

//             if (!this.pointerDown) {
//                 this.pointerDown = true;
//                 if (this.selection.selectedAtPointerDown) {
//                     this._dragStart(t.x, t.y);
//                 }
//             } else {
//                 if (this.dragging) this._dragMove(t.x, t.y);
//             }
//         }

//         if (touchCount === 0 && this.lastTouchCount === 1) {
//             this.pointerDown = false;
//             this._dragEnd();
//         }

//         this.lastTouchCount = touchCount;

//         if (!touch.active) {
//             if (!this.dragging) {
//                 if (mouse.isDown(0) && this.selection.selectedAtPointerDown) {
//                     this._dragStart(mouse.x, mouse.y);
//                     this.pointerDown = true;
//                 }
//             } else {
//                 if (!mouse.isDown(0)) {
//                     this.pointerDown = false;
//                     this._dragEnd();
//                 } else {
//                     this._dragMove(mouse.x, mouse.y);
//                 }
//             }
//         }
//     }

//     _pointerWorld(px, py) {
//         const cam = this.game.camera;
//         return {
//             x: cam.x + (px - this.canvas.width  * 0.5) / cam.scale,
//             y: cam.y + (py - this.canvas.height * 0.5) / cam.scale
//         };
//     }

//     _dragStart(px, py) {
//         const ent = this.selection.selected;
//         if (!ent) return;

//         this.dragging = true;

//         const p = this._pointerWorld(px, py);
//         this.startX = p.x;
//         this.startY = p.y;

//         this.entStartX = ent.x;
//         this.entStartY = ent.y;

//         if (ent.shape?.type === "line") {
//             this.lineStartX2 = ent.shape.x2;
//             this.lineStartY2 = ent.shape.y2;
//         }

//         bus.emit("entity:dragging", true);
//     }

//     _dragMove(px, py) {
//         const ent = this.selection.selected;
//         if (!ent) return;

//         const p = this._pointerWorld(px, py);
//         const dx = p.x - this.startX;
//         const dy = p.y - this.startY;

//         if (!ent.shape || ent.shape.type !== "line") {
//             ent.x = this.entStartX + dx;
//             ent.y = this.entStartY + dy;

//             if (ent.components?.Transform) {
//                 ent.components.Transform.x = ent.x;
//                 ent.components.Transform.y = ent.y;
//             }
//         } else {
//             const sh = ent.shape;

//             ent.x = this.entStartX + dx;
//             ent.y = this.entStartY + dy;
//             sh.x2 = this.lineStartX2 + dx;
//             sh.y2 = this.lineStartY2 + dy;

//             if (ent.components?.Transform) {
//                 ent.components.Transform.x = ent.x;
//                 ent.components.Transform.y = ent.y;
//             }

//             this._updateLineHitbox(ent);
//         }

//         bus.emit("entity:moved", { id: ent.id, x: ent.x, y: ent.y });
//         this.selection.redraw();
//     }

//     _dragEnd() {
//         if (!this.dragging) return;

//         this.dragging = false;

//         const ent = this.selection.selected;

//         bus.emit("entity:dragging", false);
//         if (ent) bus.emit("entity:move-end", { id: ent.id, x: ent.x, y: ent.y });
//     }

//     _updateLineHitbox(ent) {
//         const sh = ent.shape;
//         const x1 = ent.x;
//         const y1 = ent.y;
//         const x2 = sh.x2;
//         const y2 = sh.y2;
//         const t = sh.thickness ?? 1;

//         if (Math.abs(y2 - y1) < 0.0001) {
//             ent.hitX = Math.min(x1, x2);
//             ent.hitY = y1 - t / 2;
//             ent.hitWidth  = Math.abs(x2 - x1);
//             ent.hitHeight = t;
//         }
//         else if (Math.abs(x2 - x1) < 0.0001) {
//             ent.hitX = x1 - t / 2;
//             ent.hitY = Math.min(y1, y2);
//             ent.hitWidth  = t;
//             ent.hitHeight = Math.abs(y2 - y1);
//         }
//         else {
//             const minX = Math.min(x1, x2);
//             const maxX = Math.max(x1, x2);
//             const minY = Math.min(y1, y2);
//             const maxY = Math.max(y1, y2);

//             ent.hitX = minX - t / 2;
//             ent.hitY = minY - t / 2;
//             ent.hitWidth  = (maxX - minX) + t;
//             ent.hitHeight = (maxY - minY) + t;
//         }
//     }
// }
