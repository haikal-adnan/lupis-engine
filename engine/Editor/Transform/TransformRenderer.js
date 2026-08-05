export class TransformRenderer {
    constructor(game, selectionTool) {
        this.game = game;
        this.selection = selectionTool;
    }

    draw(shape, proj, geometry) {
        const list = this.selection.selectedList;
        if (!list || !list.length) return;
        if (!geometry || !geometry.handles || geometry.handles.length === 0) return;

        const scale = this.game.camera.scale || 1;
        const lineThick = 2 / scale; 

        const lineColor = [0, 0.6, 1, 1];  
        const dotFill   = [1, 1, 1, 1];    
        const dotStroke = [0, 0, 0, 1];    

        const b = geometry.groupBounds;
        if (b) {
            if (b.type === 'obb') {
                const v = b.v;
                shape.drawLine(v.tl.x, v.tl.y, v.tr.x, v.tr.y, lineColor, lineThick, proj);
                shape.drawLine(v.tr.x, v.tr.y, v.br.x, v.br.y, lineColor, lineThick, proj);
                shape.drawLine(v.br.x, v.br.y, v.bl.x, v.bl.y, lineColor, lineThick, proj);
                shape.drawLine(v.bl.x, v.bl.y, v.tl.x, v.tl.y, lineColor, lineThick, proj);
            } else {
                shape.drawLine(b.x, b.y, b.x + b.w, b.y, lineColor, lineThick, proj);
                shape.drawLine(b.x + b.w, b.y, b.x + b.w, b.y + b.h, lineColor, lineThick, proj);
                shape.drawLine(b.x + b.w, b.y + b.h, b.x, b.y + b.h, lineColor, lineThick, proj);
                shape.drawLine(b.x, b.y + b.h, b.x, b.y, lineColor, lineThick, proj);
            }
        }

        const rot = geometry.activeRotation || 0;

        for (const h of geometry.handles) {
            const sizes = geometry.getHandleSizes();

            if (h.type.length === 2) {
                shape.drawParametricShape(
                    "circle", h.x, h.y, sizes.rCorner * 2, sizes.rCorner * 2,
                    dotFill, dotStroke, 
                    true, lineThick, 
                    0, 0, 
                    proj, 0, 1, 1, 0.5, 0.5, false, false
                );
            } 
            else {
                if (geometry.isSizeLocked) continue;
                let w = 0, h_dim = 0;
                
                if (h.type === 'n' || h.type === 's') { 
                    w = sizes.capLen; 
                    h_dim = sizes.capThick; 
                } else { 
                    w = sizes.capThick; 
                    h_dim = sizes.capLen; 
                }

                shape.drawParametricShape(
                    "rectangle", h.x, h.y, w, h_dim,
                    dotFill, dotStroke, 
                    true, lineThick, 
                    0, 4, 
                    proj, rot, 1, 1, 0.5, 0.5, false, false
                );
            }
        }
    }
}