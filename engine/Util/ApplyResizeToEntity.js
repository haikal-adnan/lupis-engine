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
        const assetId = tr.assetId || Config.FONT;
        const font = world.assets.fonts[assetId];
        
        if (font && font.measureText) {
            const size = tr.fontSize || tr.size || 40;
            const m = font.measureText(tr.text, size);
            
            if (ent.width < 1 || ent.height < 1) {
                ent.width = m.width;
                ent.height = m.boundsHeight;
            }
        }
    } 
    
    ent.hitX = t.x;
    ent.hitY = t.y;
    ent.hitWidth = ent.width;
    ent.hitHeight = ent.height;
}