export function ApplyResizeToEntity(ent, world) {
    if (ent.components.SpriteRenderer) {
        // SpriteRenderer already uses ent.width / ent.height directly.
        // Nothing special needed here.
    }

    if (ent.components.ShapeRenderer) {
        const sh = ent.components.ShapeRenderer;

        if (sh.type === "rectangle" || sh.type === "rectStroke") {
            sh.width = ent.width;
            sh.height = ent.height;
        }

        if (sh.type === "line") {
            const dx = ent.width;
            const dy = ent.height;

            sh.x2 = ent.x + dx;
            sh.y2 = ent.y + dy;

            // Update hitbox
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
        const font = world.assets.fonts?.default;
        if (!font) return;

        const baseSize = ent._resizeStartSize ?? tr.size;
        const factor   = ent._resizeFactor     ?? 1;

        const newSize = baseSize * factor;

        tr.size = newSize;

        if (ent.text) {
            ent.text.size = newSize;    
            ent.text.value = tr.text;    
        }

        const m = font.measureText(ent.text.value, newSize);

        ent.width  = m.width;
        ent.height = m.boundsHeight;

        ent.hitX = ent.x + m.xMin;
        ent.hitY = ent.y + m.yMin;
        ent.hitWidth  = m.boundsWidth;
        ent.hitHeight = m.boundsHeight;
    }

    if (ent.components.Transform) {
        const t = ent.components.Transform;
        t.x = ent.x;
        t.y = ent.y;
        t.width  = ent.width;
        t.height = ent.height;
    }
}
