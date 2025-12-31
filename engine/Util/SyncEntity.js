export function SyncEntityComponents(entity, game) {
    if (!entity || !entity.components) return;

    // --- 1. SYNC TEXT RENDERER ---
    if (entity.components.TextRenderer) {
        const comp = entity.components.TextRenderer;
        
        if (!entity.text) entity.text = {};
        
        // Support 'value' dan fallback ke 'text'
        const rawValue = comp.value !== undefined ? comp.value : (comp.text || "");
        
        entity.text.value = rawValue;
        entity.text.size = comp.fontSize || comp.size || 12;
        entity.text.color = comp.color || "#FFFFFF";
        entity.text.align = comp.align || "left";
        entity.text.assetId = comp.assetId;

        // Logic Dimensi Text (Real-time sizing)
        if (game && game.renderer && game.renderer.text) {
            const textRenderer = game.renderer.text;
            const isEmpty = !entity.text.value || entity.text.value.trim() === "";

            if (isEmpty) {
                // Beri ukuran "Phantom" agar bisa diselect di Editor
                entity.width = 50; 
                entity.height = entity.text.size; 
            } 
            else if (textRenderer.font) {
                // Hitung ukuran asli berdasarkan font
                const m = textRenderer.measureText(entity.text.value, entity.text.size);
                
                entity.width = m.width || 1;
                entity.height = m.boundsHeight || m.baseline || 1;
            }
        }
    } else {
        delete entity.text;
    }

    // --- 2. SYNC SHAPE RENDERER ---
    if (entity.components.ShapeRenderer) {
        entity.shape = entity.components.ShapeRenderer;
        
        if (entity.shape.type === 'rectangle' || entity.shape.type === 'rectStroke') {
            entity.width = entity.shape.width;
            entity.height = entity.shape.height;
        }
    } else {
        delete entity.shape;
    }

        // --- 3. SYNC SPRITE RENDERER ---
    if (entity.components.SpriteRenderer) {
        const comp = entity.components.SpriteRenderer;
        const texture = game?.world?.assets?.textures?.[comp.assetId];
        
        entity.image = texture || null;

        if (entity.transform) {
            entity.transform.zIndex = comp.zIndex ?? entity.transform.zIndex;
        }
        
        if (comp.source) {
            // Setup Frame (Crop)
            entity.frame = { sx: comp.source.x, sy: comp.source.y, sw: comp.source.w, sh: comp.source.h };
            
            // PERBAIKAN: Cek apakah entity.width sudah ada nilainya (dari transform/scene)
            // Jika entity.width = 0 atau null, baru gunakan comp.width atau source.w
            if (!entity.width) entity.width = comp.width || comp.source.w;
            if (!entity.height) entity.height = comp.height || comp.source.h;

        } else if (texture) {
            // Setup Frame (Full Texture)
            entity.frame = { sx: 0, sy: 0, sw: texture.width, sh: texture.height };

            // PERBAIKAN: Jangan timpa jika width/height sudah ada (misal hasil resize di editor)
            // Gunakan texture.width HANYA jika entity.width masih 0/undefined.
            if (!entity.width) entity.width = comp.width || texture.width;
            if (!entity.height) entity.height = comp.height || texture.height;
        }

        if (comp.color) entity.tint = comp.color;
    }
}