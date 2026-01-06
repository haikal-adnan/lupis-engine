import Config from "../Core/Config.js";

export function ApplyResizeToEntity(ent, world) {
    const t = ent.transform;
    let isHitboxHandled = false; // Flag untuk menandai apakah hitbox sudah diurus component

    // --- 1. Sprite Renderer ---
    if (ent.components.SpriteRenderer) {
        ent.components.SpriteRenderer.width = ent.width;
        ent.components.SpriteRenderer.height = ent.height;
    }

    // --- 2. Shape Renderer ---
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
            
            const x1 = t.x; const y1 = t.y;
            const x2 = sh.x2; const y2 = sh.y2;
            const thick = sh.thickness ?? 1;

            // Logic Hitbox Khusus Line
            if (Math.abs(y2 - y1) < 0.0001) {
                ent.hitX = Math.min(x1, x2); ent.hitY = y1 - thick / 2;
                ent.hitWidth = Math.abs(x2 - x1); ent.hitHeight = thick;
            } else if (Math.abs(x2 - x1) < 0.0001) {
                ent.hitX = x1 - thick / 2; ent.hitY = Math.min(y1, y2);
                ent.hitWidth = thick; ent.hitHeight = Math.abs(y2 - y1);
            } else {
                const minX = Math.min(x1, x2); const maxX = Math.max(x1, x2);
                const minY = Math.min(y1, y2); const maxY = Math.max(y1, y2);
                ent.hitX = minX - thick / 2; ent.hitY = minY - thick / 2;
                ent.hitWidth = (maxX - minX) + thick; ent.hitHeight = (maxY - minY) + thick;
            }
            isHitboxHandled = true; // Tandai sudah selesai
        }
    }

    // --- 3. Text Renderer (SUMBER MASALAH UTAMA) ---
    if (ent.components.TextRenderer) {
        const tr = ent.components.TextRenderer;
        console.log(ent.width, ent.height)

        // const textStr = tr.value || tr.text || ""; 
        // const assetId = tr.assetId || Config.FONT;
        
        // const font = world.assets.fonts?.[assetId];
        
        // if (font && font.measureText) {
        //     // A. Ambil current size (prioritas dari runtime ent.text jika ada)
        //     const currentRenderSize = ent.text ? ent.text.size : (tr.fontSize || 12);
        //     let newFontSize = currentRenderSize;

        //     // B. Ukur dimensi text referensi (sebelum resize) untuk dapat aspect ratio
        //     const mRef = font.measureText(textStr, currentRenderSize);
        //     const baseH = mRef.boundsHeight || mRef.baseline || 1;
        //     const baseW = mRef.width || 1;

        //     // C. Hitung Size Baru berdasarkan perubahan tinggi Entity
        //     if (baseH > 0) {
        //         // Ratio: Tinggi Entity Baru / Tinggi Text Asli
        //         const ratio = ent.height / baseH;
        //         newFontSize = currentRenderSize * ratio;
        //     }
        //     if (newFontSize < 1) newFontSize = 1;

        //     // D. Terapkan Aspect Ratio ke Width Entity
        //     // Ini mencegah text gepeng. Width dipaksa mengikuti proporsi font.
        //     if (baseW > 0 && baseH > 0) {
        //         const aspectRatio = baseW / baseH;
        //         ent.width = ent.height * aspectRatio;
        //     }

        //     // E. Simpan data baru
        //     tr.fontSize = newFontSize;
        //     tr.size = newFontSize;
        //     if (ent.text) ent.text.size = newFontSize;

        //     // F. [FIX KRUSIAL] Update Hitbox Sesuai MeasureText
        //     // Kita harus mengukur ulang dengan font size BARU untuk dapat offset (xMin/yMin) yang akurat.
        //     const mNew = font.measureText(textStr, newFontSize);
            
        //     ent.hitX = t.x + (mNew.xMin || 0); // Pertahankan Offset!
        //     ent.hitY = t.y + (mNew.yMin || 0);
        //     ent.hitWidth = mNew.boundsWidth || ent.width;
        //     ent.hitHeight = mNew.boundsHeight || ent.height;

        //     isHitboxHandled = true; // Tandai agar tidak ditimpa logic generic di bawah
        // }
    }
    
    // --- 4. Generic Hitbox Fallback ---
    // Hanya jalan jika tidak di-handle khusus oleh component (seperti Text/Line)
    if (!isHitboxHandled) {
        ent.hitX = t.x;
        ent.hitY = t.y;
        ent.hitWidth = ent.width;
        ent.hitHeight = ent.height;
    }
}