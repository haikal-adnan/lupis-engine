import Config from "../Core/Config.js";

export function ApplyResizeToEntity(ent, world) {
    if (ent.components.SpriteRenderer) {
    }

    if (ent.components.ShapeRenderer) {
        const sh = ent.components.ShapeRenderer;

        if (sh.type === "rectangle" || sh.type === "rectStroke") {
            sh.width = ent.width;
            sh.height = ent.height;
            
            ent.hitX = ent.x;
            ent.hitY = ent.y;
            ent.hitWidth = ent.width;
            ent.hitHeight = ent.height;
        }

        if (sh.type === "line") {
            sh.x2 = ent.x + ent.width;
            sh.y2 = ent.y + ent.height;

            const x1 = ent.x;
            const y1 = ent.y;
            const x2 = sh.x2;
            const y2 = sh.y2;
            const t  = sh.thickness ?? 1;

            if (Math.abs(y2 - y1) < 0.0001) {
                ent.hitX = Math.min(x1, x2);
                ent.hitY = y1 - t / 2;
                ent.hitWidth  = Math.abs(x2 - x1);
                ent.hitHeight = t;
            }
            else if (Math.abs(x2 - x1) < 0.0001) {
                ent.hitX = x1 - t / 2;
                ent.hitY = Math.min(y1, y2);
                ent.hitWidth  = t;
                ent.hitHeight = Math.abs(y2 - y1);
            }
            else {
                const minX = Math.min(x1, x2);
                const maxX = Math.max(x1, x2);
                const minY = Math.min(y1, y2);
                const maxY = Math.max(y1, y2);
                ent.hitX = minX - t / 2;
                ent.hitY = minY - t / 2;
                ent.hitWidth  = (maxX - minX) + t;
                ent.hitHeight = (maxY - minY) + t;
            }
        }
    }

    if (ent.components.TextRenderer) {
        const tr = ent.components.TextRenderer;
        
        const start = ent._textStartData;
        const factor = ent._resizeFactor || 1;

        if (start) {
            // Gunakan Math.abs untuk mencegah nilai negatif
            const newSize = Math.abs(start.size * factor);
            
            // --- FIX UTAMA: Update KEDUANYA ---
            tr.fontSize = newSize; // Prioritas sistem
            tr.size = newSize;     // Fallback legacy

            // Update Runtime (Visual di layar)
            if (ent.text) {
                ent.text.size = newSize;    
                ent.text.value = tr.text;    
            }

            // Update Dimensi Fisik (Penting untuk perhitungan scale berikutnya)
            ent.width = Math.abs(start.w * factor);
            ent.height = Math.abs(start.h * factor);

            // Update Hitbox (Selection Box)
            ent.hitX = ent.x + (start.hitXOffset * factor);
            ent.hitY = ent.y + (start.hitYOffset * factor);
            ent.hitWidth = start.hitW * factor;
            ent.hitHeight = start.hitH * factor;
        } 
        else {
            // Fallback: Gunakan Asset ID dari entity, jangan Config.FONT global
            const assetId = tr.assetId;
            const font = world.assets.fonts[assetId];
            
            if (!font || !font.measureText) return;

            const currentSize = tr.fontSize || tr.size || 40;
            const m = font.measureText(tr.text, currentSize);
             
            ent.width  = m.width;
            ent.height = m.boundsHeight;
            ent.hitX = ent.x + m.xMin;
            ent.hitY = ent.y + m.yMin;
            ent.hitWidth  = m.boundsWidth;
            ent.hitHeight = m.boundsHeight;
        }
    }
}