const _colorCache = new Map();

export function HexToVec4(hex) {
    if (!hex) return [1, 1, 1, 1];
    if (_colorCache.has(hex)) return _colorCache.get(hex);

    let c = hex.replace("#", "");
    let r = 0, g = 0, b = 0, a = 1;

    if (c.length === 3) {
        r = parseInt(c[0] + c[0], 16) / 255;
        g = parseInt(c[1] + c[1], 16) / 255;
        b = parseInt(c[2] + c[2], 16) / 255;
    } else if (c.length === 6) {
        r = parseInt(c.substring(0, 2), 16) / 255;
        g = parseInt(c.substring(2, 4), 16) / 255;
        b = parseInt(c.substring(4, 6), 16) / 255;
    } else if (c.length === 8) {
        r = parseInt(c.substring(0, 2), 16) / 255;
        g = parseInt(c.substring(2, 4), 16) / 255;
        b = parseInt(c.substring(4, 6), 16) / 255;
        a = parseInt(c.substring(6, 8), 16) / 255;
    }

    const vec = [r, g, b, a];
    if (_colorCache.size > 500) _colorCache.clear();
    _colorCache.set(hex, vec);
    
    return vec;
}