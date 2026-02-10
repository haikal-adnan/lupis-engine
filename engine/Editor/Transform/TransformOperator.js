import { ApplyResizeToEntity } from "../../Util/ApplyResizeToEntity.js";
import { bus } from "../../Util/EventBus.js";

export class TransformOperator {
    constructor(world, game, input) {
        this.world = world;
        this.game = game;
        this.input = input;
    }

    _getTransform(e) {
        return e.components && (e.components.UITransform || e.components.Transform);
    }

    getSnapSettings(isUIMode = false) {
        if (isUIMode) {
            return { shouldSnap: false, gridSize: 1 };
        }

        const gridSettings = this.world.settings?.grid || { snap: true, width: 32 };
        const globalMagnet = gridSettings.snap;
        const isCtrlHeld = this.input.keyboard.isDown("Control");
        const shouldSnap = globalMagnet ? !isCtrlHeld : isCtrlHeld;
        const gridSize = gridSettings.width || 32;

        return { shouldSnap, gridSize };
    }

    move(nowPos, startPos, startData, selectedList, isUIMode = false) {
        if (!startData || startData.length === 0) return;

        const dx = nowPos.x - startPos.x;
        const dy = nowPos.y - startPos.y;
        
        const { shouldSnap, gridSize } = this.getSnapSettings(isUIMode);

        let finalDx = dx;
        let finalDy = dy;

        if (shouldSnap && startData.length > 0) {
            const leader = startData[0];
            const rawDestX = leader.x + dx;
            const rawDestY = leader.y + dy;
            
            const snappedX = Math.round(rawDestX / gridSize) * gridSize;
            const snappedY = Math.round(rawDestY / gridSize) * gridSize;

            finalDx = snappedX - leader.x;
            finalDy = snappedY - leader.y;
        }

        let changed = false;
        for (const item of startData) {
            const t = this._getTransform(item.e);
            if (t) {
                const newX = Math.round(item.x + finalDx);
                const newY = Math.round(item.y + finalDy);
                
                if (t.x !== newX || t.y !== newY) {
                    t.x = newX;
                    t.y = newY;
                    changed = true;
                }
            }
        }

        if (changed) {
            bus.emit("entity:modified", selectedList, true);
        }
    }

    rotate(nowPos, rotateCenter, rotateStartAngle, entityStartRotation, selectedList, isUIMode = false) {
        if (!selectedList || selectedList.length === 0) return;

        const t = this._getTransform(selectedList[0]);
        if (!t) return;

        // Mouse angle sekarang (Radian)
        const currentAngle = Math.atan2(nowPos.y - rotateCenter.y, nowPos.x - rotateCenter.x);
        
        // Selisih rotasi (Radian)
        let deltaAngle = currentAngle - rotateStartAngle;

        // [FIX] Konversi entityStartRotation (Derajat) ke Radian untuk perhitungan
        const startRad = entityStartRotation * (Math.PI / 180);
        let newRad = startRad + deltaAngle;

        // [FIX] Konversi hasil Radian kembali ke Derajat
        let newDeg = newRad * (180 / Math.PI);

        // Normalize 0-360
        newDeg = (newDeg % 360 + 360) % 360;

        const { shouldSnap } = this.getSnapSettings(isUIMode);

        if (shouldSnap) {
            const snapInterval = 15;
            newDeg = Math.round(newDeg / snapInterval) * snapInterval;
        }

        // Simpan sebagai Derajat
        t.rotation = Math.round(newDeg);
        bus.emit("entity:modified", selectedList, true);
    }

    resize(nowPos, startPos, resizeType, startData, selectedList, isUIMode = false) {
        if (!startData || startData.length === 0) return;

        const dx = nowPos.x - startPos.x;
        const dy = nowPos.y - startPos.y;
        if (dx === 0 && dy === 0) return;

        const { shouldSnap, gridSize } = this.getSnapSettings(isUIMode);

        const item = startData[0];
        const e = item.e;
        const t = this._getTransform(e);
        
        if (!t) return;

        const rRad = item.r * (Math.PI / 180);

        const c = Math.cos(-rRad);
        const s = Math.sin(-rRad);
        
        // Hitung delta local
        const localDx = dx * c - dy * s;
        const localDy = dx * s + dy * c;

        // Scale awal (sudah dinormalisasi jadi positif di TransformTool)
        const safeScaleX = Math.abs(item.sx) < 0.001 ? 0.001 : Math.abs(item.sx);
        const safeScaleY = Math.abs(item.sy) < 0.001 ? 0.001 : Math.abs(item.sy);

        // Adjust delta berdasarkan scale objek
        // Kita tidak perlu cek sign negatif lagi karena safeScaleX pasti positif
        let dX_Adjusted = localDx / safeScaleX;
        let dY_Adjusted = localDy / safeScaleY;

        let dW = 0, dH = 0;
        let anchorX = null, anchorY = null;

        // Mapping Handle ke perubahan Width/Height
        // Note: Karena ScaleX positif, 'w' selalu di kiri geometri, 'e' selalu di kanan geometri
        if (resizeType.includes('w')) { dW = -dX_Adjusted; anchorX = 1; } // Anchor di Kanan (1)
        if (resizeType.includes('e')) { dW = dX_Adjusted;  anchorX = 0; } // Anchor di Kiri (0)
        if (resizeType.includes('n')) { dH = -dY_Adjusted; anchorY = 1; } // Anchor di Bawah (1)
        if (resizeType.includes('s')) { dH = dY_Adjusted;  anchorY = 0; } // Anchor di Atas (0)

        // Raw Dimensions (Bisa negatif jika ditarik melewati pivot)
        let rawW = item.w + dW;
        let rawH = item.h + dH;

        // --- SNAPPING ---
        if (shouldSnap) {
            if (resizeType.includes('w') || resizeType.includes('e')) {
                rawW = Math.round(rawW / gridSize) * gridSize;
                if (Math.abs(rawW) < gridSize) rawW = gridSize * (rawW < 0 ? -1 : 1); // Prevent 0 width
                dW = rawW - item.w;
            }
            if (resizeType.includes('n') || resizeType.includes('s')) {
                rawH = Math.round(rawH / gridSize) * gridSize;
                if (Math.abs(rawH) < gridSize) rawH = gridSize * (rawH < 0 ? -1 : 1);
                dH = rawH - item.h;
            }
        }

        // --- ASPECT RATIO LOCK ---
        if (t.isRatioLocked && item.w !== 0 && item.h !== 0) {
            // Kalkulasi ulang H berdasarkan W, atau sebaliknya
            if (resizeType.length === 2 || resizeType === 'e' || resizeType === 'w') {
                rawH = (rawW / item.w) * item.h; 
                dH = rawH - item.h;
            } 
            else if (resizeType === 'n' || resizeType === 's') {
                rawW = (rawH / item.h) * item.w;
                dW = rawW - item.w;
            }
        }

        // --- UPDATE TRANSFORM PROPERTIES ---

        // 1. Logic Flip Otomatis (Figma Style)
        // Jika rawW negatif (melewati titik 0), balik status flip dari status AWAL.
        // item.flipX ?? false mencegah error undefined
        const startFlipX = item.flipX ?? false;
        const startFlipY = item.flipY ?? false;

        t.flipX = (rawW < 0) ? !startFlipX : startFlipX;
        t.flipY = (rawH < 0) ? !startFlipY : startFlipY;

        // 2. Set Width/Height (Harus Positif)
        const newW = Math.max(1, Math.round(Math.abs(rawW)));
        const newH = Math.max(1, Math.round(Math.abs(rawH)));

        t.width = newW;
        t.height = newH;
        
        // 3. Set Scale (Selalu Positif, karena arah dihandle oleh flipX/Y)
        t.scaleX = safeScaleX;
        t.scaleY = safeScaleY;

        // --- TILEMAP UPDATE ---
        if (e.components.Tilemap) {
            const tileSize = e.components.Tilemap.tileSize || 32;
            const newCols = Math.round(newW / tileSize);
            const newRows = Math.round(newH / tileSize);
            bus.emit("editor:tilemap:resize", { id: e.id, width: newCols, height: newRows });
        }

        // --- UPDATE POSISI (Pivot Compensation) ---
        // Kita menggunakan dW/dH "mentah" (yang bisa negatif) untuk menggeser posisi.
        // Ini kuncinya: meskipun width jadi positif, dW yang negatif akan menggeser 
        // posisi X ke kiri, seolah-olah objek tumbuh ke kiri (atau kanan tergantung anchor).
        
        const dW_Visual = dW * safeScaleX;
        const dH_Visual = dH * safeScaleY;

        let shiftX_World = 0, shiftY_World = 0;
        if (anchorX !== null) shiftX_World = dW_Visual * ((t.pivotX ?? 0.5) - anchorX);
        if (anchorY !== null) shiftY_World = dH_Visual * ((t.pivotY ?? 0.5) - anchorY);

        const wc = Math.cos(rRad);
        const ws = Math.sin(rRad);

        t.x = Math.round(item.x + (shiftX_World * wc - shiftY_World * ws));
        t.y = Math.round(item.y + (shiftX_World * ws + shiftY_World * wc));
        
        ApplyResizeToEntity(e, this.world);
        bus.emit("entity:modified", selectedList, true);
    }
}