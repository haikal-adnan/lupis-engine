export function SyncEntityComponents(entity, game) {
    if (!entity || !entity.components) return;

    if (entity.components.TextRenderer) {
        const comp = entity.components.TextRenderer;
        
        if (!entity.text) entity.text = {};
        
        const rawValue = comp.value !== undefined ? comp.value : (comp.text || "");
        
        entity.text.value = rawValue;
        entity.text.size = comp.fontSize || comp.size || 12;
        entity.text.color = comp.color || "#FFFFFF";
        entity.text.align = comp.align || "left";
        entity.text.assetId = comp.assetId;

        if (game && game.renderer && game.renderer.text) {
            const textRenderer = game.renderer.text;
            const isEmpty = !entity.text.value || entity.text.value.trim() === "";

            if (isEmpty) {
                entity.width = 50; 
                entity.height = entity.text.size; 
            } 
            else if (textRenderer.font) {
                const m = textRenderer.measureText(entity.text.value, entity.text.size);
                
                entity.width = m.width || 1;
                entity.height = m.boundsHeight || m.baseline || 1;
            }
        }
    } else {
        delete entity.text;
    }

    if (entity.components.ShapeRenderer) {
        entity.shape = entity.components.ShapeRenderer;
        
        if (entity.shape.type === 'rectangle' || entity.shape.type === 'rectStroke') {
            entity.width = entity.shape.width;
            entity.height = entity.shape.height;
        }
    } else {
        delete entity.shape;
    }

    if (entity.components.SpriteRenderer) {
        const comp = entity.components.SpriteRenderer;
        
        const assetId = comp.assetId;
        
        const texture = (assetId && game?.world?.assets?.textures?.[assetId]) 
                        ? game.world.assets.textures[assetId] 
                        : null;
        
        entity.image = texture;

        if (entity.transform) {
            entity.transform.zIndex = comp.zIndex ?? entity.transform.zIndex;
        }
        
        if (comp.source && (comp.source.w > 0 || comp.source.h > 0)) {
            entity.frame = { 
                sx: Number(comp.source.x) || 0, 
                sy: Number(comp.source.y) || 0, 
                sw: Number(comp.source.w) || 0, 
                sh: Number(comp.source.h) || 0 
            };
            
            if (!entity.width) entity.width = comp.width || comp.source.w;
            if (!entity.height) entity.height = comp.height || comp.source.h;
        } 
        else if (texture) {
            entity.frame = { sx: 0, sy: 0, sw: texture.width, sh: texture.height };

            if (!entity.width) entity.width = comp.width || texture.width;
            if (!entity.height) entity.height = comp.height || texture.height;
        }
        else {
            entity.frame = { sx: 0, sy: 0, sw: 100, sh: 100 };
             
            if (!entity.width) entity.width = 100;
            if (!entity.height) entity.height = 100;
        }

        if (comp.color) entity.tint = comp.color;
    }
}
