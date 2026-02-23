import Config from "../Core/Config.js";
import FontMath from "./FontMath.js"; 

export function ApplyResizeToEntity(ent, world, force = false) {
    const t = ent.components.Transform || ent.components.UITransform;
    
    if (!t) return;

    if (ent.components.SpriteRenderer) {
        const sr = ent.components.SpriteRenderer;
        if (sr.width !== undefined) sr.width = t.width;
        if (sr.height !== undefined) sr.height = t.height;
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
        
        let fontId = tr.assetId || Config.FONT;
        let font = world.assets.fonts[fontId];
        if (!font) font = world.assets.fonts["system_default"];

        if (font) {
            const textValue = tr.value || "Text";
            const fontSize = Number(tr.fontSize) || 24;

            const isTextNew = tr._lastValue !== textValue;
            const isSizeNew = tr._lastFontSize !== fontSize;
            const isZero = t.width <= 0 || t.height <= 0;

            if (force || isZero || isSizeNew || isTextNew) {
                
                const m = FontMath.measureText(font, textValue, fontSize);

                t.width = m.boundsWidth > 0 ? Math.ceil(m.boundsWidth) : 10;
                t.height = m.boundsHeight > 0 ? Math.ceil(m.boundsHeight) : Math.ceil(fontSize);
                
                tr._lastFontSize = fontSize;
                tr._lastValue = textValue;

                if (t.scaleX !== undefined) t.scaleX = 1;
                if (t.scaleY !== undefined) t.scaleY = 1;
            }
        }
    }

    if (ent.components.Transform) {
        ent.hitX = t.x;
        ent.hitY = t.y;
        ent.hitWidth = t.width;
        ent.hitHeight = t.height;
    }
}