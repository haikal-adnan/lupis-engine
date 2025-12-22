import Config from "../Core/Config.js";

export function ApplyResizeToEntity(ent, world) {
    
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
            sh.x2 = ent.x + ent.width;
            sh.y2 = ent.y + ent.height;
            
            const x1 = ent.x;
            const y1 = ent.y;
            const x2 = sh.x2;
            const y2 = sh.y2;
            const t = sh.thickness ?? 1;

            if (Math.abs(y2 - y1) < 0.0001) {
                ent.hitX = Math.min(x1, x2);
                ent.hitY = y1 - t / 2;
                ent.hitWidth = Math.abs(x2 - x1);
                ent.hitHeight = t;
            } else if (Math.abs(x2 - x1) < 0.0001) {
                ent.hitX = x1 - t / 2;
                ent.hitY = Math.min(y1, y2);
                ent.hitWidth = t;
                ent.hitHeight = Math.abs(y2 - y1);
            } else {
                const minX = Math.min(x1, x2);
                const maxX = Math.max(x1, x2);
                const minY = Math.min(y1, y2);
                const maxY = Math.max(y1, y2);
                ent.hitX = minX - t / 2;
                ent.hitY = minY - t / 2;
                ent.hitWidth = (maxX - minX) + t;
                ent.hitHeight = (maxY - minY) + t;
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
    
    ent.hitX = ent.x;
    ent.hitY = ent.y;
    ent.hitWidth = ent.width;
    ent.hitHeight = ent.height;
}