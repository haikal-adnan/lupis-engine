import Config from "../Core/Config.js";

export function ApplyResizeToEntity(ent, world) {
    const t = ent.components.Transform;
    if (!t) return;

    if (ent.components.SpriteRenderer) {
        const sr = ent.components.SpriteRenderer;

        if (sr.width !== undefined) {
            sr.width = t.width;
        }

        if (sr.height !== undefined) {
            sr.height = t.height;
        }
    }

    if (ent.components.ShapeRenderer) {
        const sh = ent.components.ShapeRenderer;

        if (["rectangle", "rectStroke", "circle"].includes(sh.type)) {
            sh.width = t.width;
            sh.height = t.height;
        }
    }

    if (ent.components.TextRenderer) {
        const tr = ent.components.TextRenderer;

        if (t.width <= 0 || t.height <= 0) {
            const fontId = tr.assetId || Config.FONT;
            const font = world.assets.fonts[fontId];

            if (font && world.rendererManager && world.rendererManager.text) {
                const textValue = tr.value || "Text";
                const fontSize = tr.fontSize || 24;

                const m = world.rendererManager.text.measureText(
                    font,
                    textValue,
                    fontSize
                );

                t.width = m.boundsWidth > 0 ? m.boundsWidth : 10;
                t.height = m.boundsHeight > 0 ? m.boundsHeight : fontSize;
            }
        }
    }
    console.log(world)

    ent.hitX = t.x;
    ent.hitY = t.y;
    ent.hitWidth = t.width;
    ent.hitHeight = t.height;
}
