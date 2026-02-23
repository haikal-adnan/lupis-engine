export function calculateQuadVertices(x, y, w, h, rot, sx, sy, px, py) {
    const finalW = w * sx;
    const finalH = h * sy;

    const offsetX = -px * finalW;
    const offsetY = -py * finalH;

    const c = Math.cos(rot);
    const s = Math.sin(rot);

    const transform = (lx, ly) => {
        const ox = lx + offsetX;
        const oy = ly + offsetY;

        return {
            x: x + (ox * c - oy * s),
            y: y + (ox * s + oy * c)
        };
    };

    return {
        tl: transform(0, 0),          
        tr: transform(finalW, 0),    
        bl: transform(0, finalH),  
        br: transform(finalW, finalH) 
    };
}