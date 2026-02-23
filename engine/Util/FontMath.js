export default class FontMath {
    static measureText(font, str, size) {
        if (!font || !font.chars || !font.info || !str) {
            return { width: 0, height: 0, xMin: 0, yMin: 0, xMax: 0, yMax: 0 };
        }

        const scale = size / font.info.size;
        let cx = 0;
        let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;

        for (const ch of str) {
            const gdat = font.chars[ch.charCodeAt(0)];
            if (!gdat) continue;

            const x0 = cx + gdat.ox * scale;
            const y0 = gdat.oy * scale;
            const x1 = x0 + gdat.w * scale;
            const y1 = y0 + gdat.h * scale;

            if (x0 < xMin) xMin = x0;
            if (y0 < yMin) yMin = y0;
            if (x1 > xMax) xMax = x1;
            if (y1 > yMax) yMax = y1;

            cx += gdat.adv * scale;
        }

        if (xMin === Infinity) {
            xMin = 0; xMax = cx; yMin = 0; yMax = (font.common?.lineHeight || 10) * scale;
        }

        return {
            width: cx,
            boundsWidth: xMax - xMin,
            boundsHeight: yMax - yMin,
            xMin, yMin, xMax, yMax,
            baseline: (font.common?.base || 0) * scale
        };
    }
}