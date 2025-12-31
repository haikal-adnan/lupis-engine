import Config from "../Core/Config.js";

export function ApplyResizeToEntity(ent, world) {
    const t = ent.transform; // Helper shorthand

    if (ent.components.SpriteRenderer) {
        ent.components.SpriteRenderer.width = ent.width;
        ent.components.SpriteRenderer.height = ent.height;
    }

    if (ent.components.ShapeRenderer) {
        const sh = ent.components.ShapeRenderer;
        
        if (['rectangle', 'rectStroke'].includes(sh.type)) {
            sh.width = ent.width;
            sh.height = ent.height;
        }

        if (sh.type === "line") {
            // Update posisi endpoint relatif terhadap transform baru
            sh.x2 = t.x + ent.width;
            sh.y2 = t.y + ent.height;
            
            const x1 = t.x;
            const y1 = t.y;
            const x2 = sh.x2;
            const y2 = sh.y2;
            const thick = sh.thickness ?? 1;

            if (Math.abs(y2 - y1) < 0.0001) {
                ent.hitX = Math.min(x1, x2);
                ent.hitY = y1 - thick / 2;
                ent.hitWidth = Math.abs(x2 - x1);
                ent.hitHeight = thick;
            } else if (Math.abs(x2 - x1) < 0.0001) {
                ent.hitX = x1 - thick / 2;
                ent.hitY = Math.min(y1, y2);
                ent.hitWidth = thick;
                ent.hitHeight = Math.abs(y2 - y1);
            } else {
                const minX = Math.min(x1, x2);
                const maxX = Math.max(x1, x2);
                const minY = Math.min(y1, y2);
                const maxY = Math.max(y1, y2);
                ent.hitX = minX - thick / 2;
                ent.hitY = minY - thick / 2;
                ent.hitWidth = (maxX - minX) + thick;
                ent.hitHeight = (maxY - minY) + thick;
            }
            return;
        }
    }

if (ent.components.TextRenderer) {
        const tr = ent.components.TextRenderer;
        // Support 'value' (baru) dan fallback ke 'text' (lama)
        const textStr = tr.value || tr.text || ""; 
        const assetId = tr.assetId || Config.FONT;
        
        // Cek keberadaan font
        const font = world.assets.fonts?.[assetId];
        
        if (font && font.measureText) {
            // 1. Ambil ukuran font saat ini sebelum resize
            const currentSize = tr.fontSize || tr.size || 12;

            // 2. Ukur dimensi teks jika menggunakan ukuran font saat ini
            const m = font.measureText(textStr, currentSize);
            const baseHeight = m.boundsHeight || m.baseline || 1;
            const baseWidth = m.width || 1;

            // 3. Hitung Ratio Scale
            // Kita gunakan Height sebagai patokan utama perubahan font size
            // (Standard tipografi: tinggi menentukan ukuran)
            let newFontSize = currentSize;
            
            // Mencegah pembagian nol
            if (baseHeight > 0) {
                const ratio = ent.height / baseHeight;
                newFontSize = currentSize * ratio;
            }

            // 4. Update Properti Component
            tr.fontSize = newFontSize;
            tr.size = newFontSize; // Sync fallback property

            // 5. [PENTING] Koreksi Width Entity agar Aspect Ratio terjaga
            // Jika kita hanya drag tinggi, lebar harus menyesuaikan proporsi text
            // agar huruf tidak gepeng (stretch)
            if (baseWidth > 0 && baseHeight > 0) {
                const aspectRatio = baseWidth / baseHeight;
                ent.width = ent.height * aspectRatio;
            }
        }
    }
    
    ent.hitX = t.x;
    ent.hitY = t.y;
    ent.hitWidth = ent.width;
    ent.hitHeight = ent.height;
}