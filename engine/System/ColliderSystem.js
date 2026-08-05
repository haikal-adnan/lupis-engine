export default class ColliderSystem {
    constructor(game) {
        this.game = game;
    }

    moveAndSlide(entity, dx, dy) {
        if (entity.active === false) return null;
        if (!entity.components.Transform) return null;
        
        const boundsList = this.getBounds(entity).filter(b => b.type === 'solid');
        if (boundsList.length === 0) {
            entity.components.Transform.x += dx;
            entity.components.Transform.y += dy;
            return null;
        }

        this._normalizeStuck(entity);

        const MAX_STEP_SIZE = 8;
        const distance = Math.sqrt(dx*dx + dy*dy);
        if (distance < 0.001) return null;

        const steps = Math.ceil(distance / MAX_STEP_SIZE);
        const stepX = dx / steps;
        const stepY = dy / steps;
        
        let finalHits = { x: null, y: null, normals: [] };
        let hasCollision = false;

        for (let i = 0; i < steps; i++) {
            const hit = this._moveSingleStep(entity, stepX, stepY);
            if (hit) {
                if (hit.x) finalHits.x = hit.x;
                if (hit.y) finalHits.y = hit.y;
                if (hit.normals) finalHits.normals.push(...hit.normals);
                hasCollision = true;
            }
        }
        return hasCollision ? finalHits : null;
    }

    _normalizeStuck(entity) {
        if (!this._findCollision(entity, 'solid')) return false;

        const t = entity.components.Transform;
        const maxNudge = 12; 
        const origX = t.x;
        const origY = t.y;

        const directions = [
            { dx: 0, dy: -1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 }
        ];

        for (let step = 1; step <= maxNudge; step++) {
            for (let dir of directions) {
                t.x = origX + (dir.dx * step);
                t.y = origY + (dir.dy * step);
                
                if (!this._findCollision(entity, 'solid')) return true;
            }
        }

        t.x = origX;
        t.y = origY;
        return false;
    }

    _moveSingleStep(entity, dx, dy) {
        const transform = entity.components.Transform;
        let hits = { x: null, y: null, normals: [] };
        
        transform.x += dx;
        transform.y += dy;

        let iter = 0;
        let maxIters = 4;
        let hasCollision = false;

        while (iter < maxIters) {
            const collision = this._findCollision(entity, 'solid');
            if (!collision) break;

            hasCollision = true;
            const mtv = this._resolveOverlap(entity, collision);

            if (mtv && mtv.axis) {
                hits.normals.push(mtv.axis);
                if (Math.abs(mtv.axis.x) > Math.abs(mtv.axis.y)) {
                    hits.x = collision;
                } else {
                    hits.y = collision;
                }
            } else {
                break;
            }
            iter++;
        }
        return hasCollision ? hits : null;
    }

    checkSolid(entity) {
        return this._findCollision(entity, 'solid');
    }

    checkOverlap(entity, targetTag = null) {
        if (entity.active === false) return null;

        const overlaps = this._findAllCollisions(entity, null, targetTag);
        if (overlaps.length === 0) return null;

        const dynamicEntity = overlaps.find(e => !e.components.Tilemap);
        if (dynamicEntity) return dynamicEntity; 

        return overlaps[0];
    }

    _getInactiveLayers() {
        const worldLayers = this.game.world.layersWorld || [];
        const uiLayers = this.game.world.layersUI || [];
        const allLayers = [...worldLayers, ...uiLayers];
        
        return new Set(
            allLayers
                .filter(l => l.visible === false || l.active === false)
                .map(l => l._id)
        );
    }

    _getTilemapHitBounds(boundsA, tilemapEntity) {
        const tm = tilemapEntity.components.Tilemap;
        const t = tilemapEntity.components.Transform || { x: 0, y: 0, pivotX: 0, pivotY: 0, scaleX: 1, scaleY: 1 };
        
        const scaleX = t.scaleX || 1;
        const scaleY = t.scaleY || 1;
        const scaledTileW = (tm.tileWidth || 32) * Math.abs(scaleX);
        const scaledTileH = (tm.tileHeight || 32) * Math.abs(scaleY);
        const cols = tm.width || 0;
        const rows = tm.height || 0;
        
        const startX = t.x - ((cols * scaledTileW) * (t.pivotX ?? 0));
        const startY = t.y - ((rows * scaledTileH) * (t.pivotY ?? 0));
        
        const corners = this._getObbCorners(boundsA);
        const minX = Math.min(...corners.map(c => c.x));
        const maxX = Math.max(...corners.map(c => c.x));
        const minY = Math.min(...corners.map(c => c.y));
        const maxY = Math.max(...corners.map(c => c.y));

        let startCol = Math.floor((minX - startX) / scaledTileW);
        let endCol = Math.ceil((maxX - startX) / scaledTileW);
        let startRow = Math.floor((minY - startY) / scaledTileH);
        let endRow = Math.ceil((maxY - startY) / scaledTileH);

        startCol = Math.max(0, Math.min(cols, startCol));
        endCol = Math.max(0, Math.min(cols, endCol));
        startRow = Math.max(0, Math.min(rows, startRow));
        endRow = Math.max(0, Math.min(rows, endRow));

        for (let y = startRow; y < endRow; y++) {
            for (let x = startCol; x < endCol; x++) {
                const index = y * cols + x;
                if (tm.data[index] > 0) {
                    const tileBounds = {
                        x: startX + (x * scaledTileW),
                        y: startY + (y * scaledTileH),
                        w: scaledTileW,
                        h: scaledTileH,
                        rotation: 0,
                        pivotX: 0, 
                        pivotY: 0 
                    };
                    
                    if (this._obbIntersect(boundsA, tileBounds)) {
                        return tileBounds;
                    }
                }
            }
        }
        return null;
    }

    _findCollision(entity, requiredType = null, targetTag = null) {
        const boundsAList = this.getBounds(entity);
        if (boundsAList.length === 0) return null;

        const currentId = entity.id || entity._id;
        const entities = this.game.world.entities;
        const inactiveLayers = this._getInactiveLayers();

        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            const otherId = other.id || other._id;
            
            if (otherId === currentId) continue;
            if (other.active === false) continue;
            if (other.layerId && inactiveLayers.has(other.layerId)) continue;
            
            if (targetTag && targetTag.trim() !== "") {
                const otherTag = other.tag || other.components?.Tags?.value;
                if (otherTag !== targetTag) continue; 
            }

            if (other.components.Tilemap && other.components.Tilemap.isSolid) {
                if (requiredType !== null && requiredType !== 'solid') continue;
                
                for (let bA of boundsAList) {
                    if (requiredType !== null && bA.type !== requiredType) continue;
                    const hitBounds = this._getTilemapHitBounds(bA, other);
                    if (hitBounds) return other;
                }
            } else {
                const col = other.components.Collider;
                const shape = other.components.ShapeRenderer;
                const hasCollider = col && col.data && col.data.some(c => c.enabled);
                const hasShape = shape && (shape.enablePolygonCollision || shape.enableSegmentCollision || shape.enableCircleCollision);

                if (!hasCollider && !hasShape) continue;
                
                const boundsBList = this.getBounds(other);
                for (let bA of boundsAList) {
                    if (requiredType !== null && bA.type !== requiredType) continue;
                    for (let bB of boundsBList) {
                        if (requiredType !== null && bB.type !== requiredType) continue;
                        if (this._obbIntersect(bA, bB)) return other;
                    }
                }
            }
        }
        return null;
    }

    _findAllCollisions(entity, requiredType = null, targetTag = null) {
        const results = [];
        const boundsAList = this.getBounds(entity);
        if (boundsAList.length === 0) return results;

        const currentId = entity.id || entity._id;
        const entities = this.game.world.entities;
        const inactiveLayers = this._getInactiveLayers();

        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            const otherId = other.id || other._id;

            if (otherId === currentId) continue;
            if (other.active === false) continue;
            if (other.layerId && inactiveLayers.has(other.layerId)) continue;

            if (targetTag && targetTag.trim() !== "") {
                const otherTag = other.tag || other.components?.Tags?.value;
                if (otherTag !== targetTag) continue; 
            }

            let collided = false;

            if (other.components.Tilemap && other.components.Tilemap.isSolid) {
                if (requiredType !== null && requiredType !== 'solid') continue;
                
                for (let bA of boundsAList) {
                    if (requiredType !== null && bA.type !== requiredType) continue;
                    if (this._getTilemapHitBounds(bA, other)) {
                        collided = true;
                        break;
                    }
                }
            } else {
                const col = other.components.Collider;
                const shape = other.components.ShapeRenderer;
                const hasCollider = col && col.data && col.data.some(c => c.enabled);
                const hasShape = shape && (shape.enablePolygonCollision || shape.enableSegmentCollision);

                if (!hasCollider && !hasShape) continue;

                const boundsBList = this.getBounds(other);
                for (let bA of boundsAList) {
                    if (requiredType !== null && bA.type !== requiredType) continue;
                    for (let bB of boundsBList) {
                        if (requiredType !== null && bB.type !== requiredType) continue;
                        if (this._obbIntersect(bA, bB)) {
                            collided = true;
                            break;
                        }
                    }
                    if (collided) break;
                }
            }

            if (collided) results.push(other);
        }
        return results;
    }

    getBounds(entity) {
        const t = entity.components.Transform;
        if (!t) return [];

        const boundsList = [];
        const scaleX = t.scaleX ?? 1;
        const scaleY = t.scaleY ?? 1;
        const tRotRad = (t.rotation || 0) * (Math.PI / 180);
        const cosT = Math.cos(tRotRad);
        const sinT = Math.sin(tRotRad);

        const colliderComp = entity.components.Collider;
        if (colliderComp && Array.isArray(colliderComp.data)) {
            for (let i = 0; i < colliderComp.data.length; i++) {
                const c = colliderComp.data[i];
                if (!c.enabled) continue; 

                const cW = (c.autoFit ? t.width : c.width) * Math.abs(scaleX);
                const cH = (c.autoFit ? t.height : c.height) * Math.abs(scaleY);
                const pX = c.pivotX ?? 0.5;
                const pY = c.pivotY ?? 0.5;

                const localTlX = -t.width * Math.abs(scaleX) * (t.pivotX ?? 0.5) + (c.offsetX || 0) * Math.abs(scaleX);
                const localTlY = -t.height * Math.abs(scaleY) * (t.pivotY ?? 0.5) + (c.offsetY || 0) * Math.abs(scaleY);

                const localPx = localTlX + cW * pX;
                const localPy = localTlY + cH * pY;

                const worldPx = t.x + localPx * cosT - localPy * sinT;
                const worldPy = t.y + localPx * sinT + localPy * cosT;

                const totalRot = c.autoFit ? tRotRad : tRotRad + ((c.rotation || 0) * (Math.PI / 180));

                boundsList.push({
                    x: worldPx, 
                    y: worldPy, 
                    w: cW, 
                    h: cH,
                    rotation: totalRot,
                    pivotX: pX,
                    pivotY: pY,
                    type: c.type 
                });
            }
        }

        const shapeComp = entity.components.ShapeRenderer;
        if (shapeComp && shapeComp.elements) {
            const pointMap = new Map();
            for (const el of shapeComp.elements) {
                if (el.type === 'point') pointMap.set(el.id, el);
            }

            const toWorld = (lx, ly) => {
                const absX = lx * (t.width / 100) * scaleX;
                const absY = ly * (t.height / 100) * scaleY;
                return {
                    x: t.x + absX * cosT - absY * sinT,
                    y: t.y + absX * sinT + absY * cosT
                };
            };

            if (shapeComp.enablePolygonCollision) {
                for (const el of shapeComp.elements) {
                    if (el.type === 'polygon' && el.enabled !== false) {
                        const pts = (el.points || []).map(id => pointMap.get(id)).filter(Boolean);
                        if (pts.length >= 3) {
                            boundsList.push({ type: 'solid', vertices: pts.map(p => toWorld(p.x, p.y)) });
                        }
                    }
                }
            }

            if (shapeComp.enableSegmentCollision) {
                for (const el of shapeComp.elements) {
                    if (el.type === 'segment' && el.enabled !== false) {
                        const pts = (el.points || []).map(id => pointMap.get(id)).filter(Boolean);
                        for (let k = 0; k < pts.length - 1; k++) {
                            boundsList.push({
                                type: 'solid',
                                vertices: [toWorld(pts[k].x, pts[k].y), toWorld(pts[k+1].x, pts[k+1].y)]
                            });
                        }
                    } else if (el.type === 'line' && el.enabled !== false) {
                        const p1 = pointMap.get(el.p1);
                        const p2 = pointMap.get(el.p2);
                        if (p1 && p2) {
                            boundsList.push({ type: 'solid', vertices: [toWorld(p1.x, p1.y), toWorld(p2.x, p2.y)] });
                        }
                    }
                }
            }

            if (shapeComp.enableCircleCollision) {
                for (const el of shapeComp.elements) {
                    if (el.type === 'circle' && el.enabled !== false) {
                        const centerPt = pointMap.get(el.pCenter);
                        const edgePt = pointMap.get(el.pEdge);
                        
                        if (centerPt && edgePt) {
                            const worldCenter = toWorld(centerPt.x, centerPt.y);
                            const worldEdge = toWorld(edgePt.x, edgePt.y);
                            
                            const radius = Math.hypot(worldEdge.x - worldCenter.x, worldEdge.y - worldCenter.y);
                            
                            boundsList.push({
                                type: 'solid',
                                shapeType: 'circle',
                                x: worldCenter.x,
                                y: worldCenter.y,
                                radius: radius 
                            });
                        }
                    }
                }
            }
        }

        return boundsList;
    }

    _obbIntersect(a, b) {
        const isCircleA = a.shapeType === 'circle';
        const isCircleB = b.shapeType === 'circle';

        if (isCircleA && isCircleB) {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            const overlap = (a.radius + b.radius) - dist;
            
            if (overlap > 0) {
                const axis = dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 1, y: 0 };
                return { overlap, axis };
            }
            return false;
        }

        const cornersA = isCircleA ? [] : this._getObbCorners(a);
        const cornersB = isCircleB ? [] : this._getObbCorners(b);
        
        const axes = [...this._getObbAxes(cornersA), ...this._getObbAxes(cornersB)];
        
        if (isCircleA && cornersB.length > 0) {
            const axis = this._getCircleToPolygonAxis(a, cornersB);
            if (axis) axes.push(axis);
        }
        if (isCircleB && cornersA.length > 0) {
            const axis = this._getCircleToPolygonAxis(b, cornersA);
            if (axis) axes.push(axis);
        }

        let minOverlap = Infinity;
        let smallestAxis = null;

        for (let i = 0; i < axes.length; i++) {
            const axis = axes[i];
            const pA = this._projectShape(a, cornersA, axis);
            const pB = this._projectShape(b, cornersB, axis);
            
            if (pA.max <= pB.min || pB.max <= pA.min) return false;
            
            const overlap = Math.min(pA.max - pB.min, pB.max - pA.min);
            if (overlap < minOverlap) {
                minOverlap = overlap;
                smallestAxis = axis;
            }
        }

        const cxA = isCircleA ? a.x : cornersA.reduce((sum, c) => sum + c.x, 0) / cornersA.length;
        const cyA = isCircleA ? a.y : cornersA.reduce((sum, c) => sum + c.y, 0) / cornersA.length;
        
        const cxB = isCircleB ? b.x : cornersB.reduce((sum, c) => sum + c.x, 0) / cornersB.length;
        const cyB = isCircleB ? b.y : cornersB.reduce((sum, c) => sum + c.y, 0) / cornersB.length;

        const dx = cxA - cxB;
        const dy = cyA - cyB;

        if (dx * smallestAxis.x + dy * smallestAxis.y < 0) {
            smallestAxis.x *= -1;
            smallestAxis.y *= -1;
        }

        return { overlap: minOverlap, axis: smallestAxis };
    }

    _projectShape(shape, corners, axis) {
        if (shape.shapeType === 'circle') {
            const centerProj = shape.x * axis.x + shape.y * axis.y;
            return { 
                min: centerProj - shape.radius, 
                max: centerProj + shape.radius 
            };
        }
        
        let min = Infinity, max = -Infinity;
        for (let i = 0; i < corners.length; i++) {
            const dot = corners[i].x * axis.x + corners[i].y * axis.y;
            if (dot < min) min = dot;
            if (dot > max) max = dot;
        }
        return { min, max };
    }

    _getCircleToPolygonAxis(circle, corners) {
        let closestDistSq = Infinity;
        let closestPt = null;

        for (let i = 0; i < corners.length; i++) {
            const dx = corners[i].x - circle.x;
            const dy = corners[i].y - circle.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < closestDistSq) {
                closestDistSq = distSq;
                closestPt = corners[i];
            }
        }

        if (!closestPt) return null;

        const dx = closestPt.x - circle.x;
        const dy = closestPt.y - circle.y;
        const len = Math.hypot(dx, dy);
        
        if (len > 0) return { x: dx / len, y: dy / len };
        return { x: 1, y: 0 }; 
    }

    _getObbCorners(b) {
        if (b.vertices) return b.vertices; 
        if (b.shapeType === 'circle') {
            const r = b.radius;
            return [
                { x: b.x - r, y: b.y - r }, 
                { x: b.x + r, y: b.y - r },
                { x: b.x + r, y: b.y + r },
                { x: b.x - r, y: b.y + r } 
            ];
        }

        const cx = b.x; 
        const cy = b.y;
        const cos = Math.cos(b.rotation || 0);
        const sin = Math.sin(b.rotation || 0);
        
        const left = -b.w * (b.pivotX ?? 0.5);
        const right = b.w * (1 - (b.pivotX ?? 0.5));
        const top = -b.h * (b.pivotY ?? 0.5);
        const bottom = b.h * (1 - (b.pivotY ?? 0.5));
        
        return [
            { x: cx + left*cos - top*sin, y: cy + left*sin + top*cos },      
            { x: cx + right*cos - top*sin, y: cy + right*sin + top*cos },   
            { x: cx + right*cos - bottom*sin, y: cy + right*sin + bottom*cos }, 
            { x: cx + left*cos - bottom*sin, y: cy + left*sin + bottom*cos }
        ];
    }

    _getObbAxes(c) {
        const axes = [];
        for (let i = 0; i < c.length; i++) {
            const p1 = c[i];
            const p2 = c[(i + 1) % c.length];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy);
            if (len > 0) {
                axes.push({ x: -dy / len, y: dx / len }); 

                if (c.length === 2) {
                    axes.push({ x: dx / len, y: dy / len });
                }
            }
        }
        return axes;
    }

    _project(corners, axis) {
        let min = Infinity, max = -Infinity;
        for (let i = 0; i < corners.length; i++) {
            const dot = corners[i].x * axis.x + corners[i].y * axis.y;
            if (dot < min) min = dot;
            if (dot > max) max = dot;
        }
        return { min, max };
    }

    _resolveOverlap(entity, other) {
        const t = entity.components.Transform;
        const boundsAList = this.getBounds(entity).filter(b => b.type === 'solid');
        
        let mtv = null;

        for (let bA of boundsAList) {
            if (other.components.Tilemap) {
                let hitBounds = this._getTilemapHitBounds(bA, other);
                if (hitBounds) {
                    mtv = this._obbIntersect(bA, hitBounds);
                }
            } else {
                const boundsBList = this.getBounds(other).filter(b => b.type === 'solid');
                for (let bB of boundsBList) {
                    let res = this._obbIntersect(bA, bB);
                    if (res) {
                        mtv = res;
                        break;
                    }
                }
            }
            if (mtv) break;
        }

        if (!mtv || !mtv.axis) return null;

        t.x += mtv.axis.x * (mtv.overlap + 0.01);
        t.y += mtv.axis.y * (mtv.overlap + 0.01);
        
        return mtv;
    }
}