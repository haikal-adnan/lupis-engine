export default class ColliderSystem {
    constructor(game) {
        this.game = game;
    }

    moveAndSlide(entity, dx, dy) {
        if (entity.active === false || entity.isActive === false) return null;
        if (!entity.components.Transform) return null;
        
        const collider = entity.components.Collider;
        if (!collider || !collider.enabled) {
            entity.components.Transform.x += dx;
            entity.components.Transform.y += dy;
            return null;
        }

        const MAX_STEP_SIZE = 8;
        const distance = Math.sqrt(dx*dx + dy*dy);
        if (distance < 0.001) return null;

        const steps = Math.ceil(distance / MAX_STEP_SIZE);
        const stepX = dx / steps;
        const stepY = dy / steps;
        
        let finalHits = { x: null, y: null };
        let hasCollision = false;

        for (let i = 0; i < steps; i++) {
            const hit = this._moveSingleStep(entity, stepX, stepY);
            if (hit) {
                if (hit.x) finalHits.x = hit.x;
                if (hit.y) finalHits.y = hit.y;
                hasCollision = true;
            }
        }
        return hasCollision ? finalHits : null;
    }

    _moveSingleStep(entity, dx, dy) {
        const transform = entity.components.Transform;
        let hits = { x: null, y: null };
        
        if (Math.abs(dx) > 0.0001) {
            transform.x += dx;
            const collisionX = this._findCollision(entity, 'solid');
            if (collisionX) {
                this._resolveOverlap(entity, collisionX, 'x', dx);
                hits.x = collisionX;
            }
        }
        
        if (Math.abs(dy) > 0.0001) {
            transform.y += dy;
            const collisionY = this._findCollision(entity, 'solid');
            if (collisionY) {
                this._resolveOverlap(entity, collisionY, 'y', dy);
                hits.y = collisionY;
            }
        }
        return (hits.x || hits.y) ? hits : null;
    }

    checkSolid(entity) {
        return this._findCollision(entity, 'solid');
    }

    checkOverlap(entity, targetTag = null) {
        if (entity.active === false || entity.isActive === false) return null;

        const overlaps = this._findAllCollisions(entity, null, targetTag);
        if (overlaps.length === 0) return null;

        const dynamicEntity = overlaps.find(e => !e.components.Tilemap);
        if (dynamicEntity) {
            return dynamicEntity; 
        }

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
        
        const totalW = cols * scaledTileW;
        const totalH = rows * scaledTileH;
        
        const startX = t.x - (totalW * (t.pivotX ?? 0));
        const startY = t.y - (totalH * (t.pivotY ?? 0));
        
        const mapBounds = { x: startX, y: startY, w: totalW, h: totalH };
        if (!this._aabbIntersect(boundsA, mapBounds)) return null;

        const overlapX = Math.max(boundsA.x, startX);
        const overlapY = Math.max(boundsA.y, startY);
        const overlapR = Math.min(boundsA.x + boundsA.w, startX + totalW);
        const overlapB = Math.min(boundsA.y + boundsA.h, startY + totalH);

        let startCol = Math.floor((overlapX - startX) / scaledTileW);
        let endCol = Math.ceil((overlapR - startX) / scaledTileW);
        let startRow = Math.floor((overlapY - startY) / scaledTileH);
        let endRow = Math.ceil((overlapB - startY) / scaledTileH);

        startCol = Math.max(0, Math.min(cols, startCol));
        endCol = Math.max(0, Math.min(cols, endCol));
        startRow = Math.max(0, Math.min(rows, startRow));
        endRow = Math.max(0, Math.min(rows, endRow));

        for (let y = startRow; y < endRow; y++) {
            for (let x = startCol; x < endCol; x++) {
                const index = y * cols + x;
                if (tm.data[index] > 0) {
                    return {
                        x: startX + (x * scaledTileW),
                        y: startY + (y * scaledTileH),
                        w: scaledTileW,
                        h: scaledTileH
                    };
                }
            }
        }
        return null;
    }

    _findCollision(entity, requiredType = null, targetTag = null) {
        const boundsA = this.getBounds(entity);
        if (!boundsA) return null;

        const currentId = entity.id || entity._id;
        const entities = this.game.world.entities;
        const inactiveLayers = this._getInactiveLayers();

        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            const otherId = other.id || other._id;
            
            if (otherId === currentId) continue;
            if (other.active === false || other.isActive === false) continue;
            if (other.layerId && inactiveLayers.has(other.layerId)) continue;
            
            if (targetTag && targetTag.trim() !== "") {
                const otherTag = other.tag || other.components?.Tags?.value;
                if (otherTag !== targetTag) continue; 
            }

            if (other.components.Tilemap && other.components.Tilemap.isSolid) {
                if (requiredType !== null && requiredType !== 'solid') continue;
                
                const hitBounds = this._getTilemapHitBounds(boundsA, other);
                if (hitBounds) return other;
                
            } else {
                const col = other.components.Collider;
                if (!col || !col.enabled) continue;
                if (requiredType !== null && col.type !== requiredType) continue;
                
                const boundsB = this.getBounds(other);
                if (boundsB && this._aabbIntersect(boundsA, boundsB)) return other;
            }
        }
        return null;
    }

    _findAllCollisions(entity, requiredType = null, targetTag = null) {
        const results = [];
        const boundsA = this.getBounds(entity);
        if (!boundsA) return results;

        const currentId = entity.id || entity._id;
        const entities = this.game.world.entities;
        const inactiveLayers = this._getInactiveLayers();

        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            const otherId = other.id || other._id;

            if (otherId === currentId) continue;
            if (other.active === false || other.isActive === false) continue;
            if (other.layerId && inactiveLayers.has(other.layerId)) continue;

            if (targetTag && targetTag.trim() !== "") {
                const otherTag = other.tag || other.components?.Tags?.value;
                if (otherTag !== targetTag) continue; 
            }

            if (other.components.Tilemap && other.components.Tilemap.isSolid) {
                if (requiredType !== null && requiredType !== 'solid') continue;
                
                const hitBounds = this._getTilemapHitBounds(boundsA, other);
                if (hitBounds) results.push(other);
                
            } else {
                const col = other.components.Collider;
                if (!col || !col.enabled) continue;
                if (requiredType !== null && col.type !== requiredType) continue;

                const boundsB = this.getBounds(other);
                if (boundsB && this._aabbIntersect(boundsA, boundsB)) {
                    results.push(other);
                }
            }
        }
        return results;
    }

    getBounds(entity) {
        const t = entity.components.Transform;
        const c = entity.components.Collider;
        if (!t || !c) return null;

        const pX = t.pivotX ?? 0.5;
        const pY = t.pivotY ?? 0.5;
        const scaleX = t.scaleX ?? 1;
        const scaleY = t.scaleY ?? 1;
        
        // 1. Dapatkan ukuran visual entity (Sprite/Tilemap base)
        const visualWidth = t.width * Math.abs(scaleX);
        const visualHeight = t.height * Math.abs(scaleY);
        
        // 2. Tentukan titik origin ujung kiri-atas (berdasarkan pivot)
        const originX = t.x - (visualWidth * pX);
        const originY = t.y - (visualHeight * pY);
        
        // 3. Kalikan lebar & tinggi collider dengan Math.abs(scale)
        const colliderW = (c.autoFit ? t.width : c.width) * Math.abs(scaleX);
        const colliderH = (c.autoFit ? t.height : c.height) * Math.abs(scaleY);

        // 4. Kalikan Offset dengan scale (tanpa Math.abs, agar jika di-flip (negatif scale), offset ikut berbalik posisinya)
        const finalOffsetX = (c.offsetX || 0) * scaleX;
        const finalOffsetY = (c.offsetY || 0) * scaleY;

        return {
            x: originX + finalOffsetX,
            y: originY + finalOffsetY,
            w: colliderW, 
            h: colliderH
        };
    }
    _aabbIntersect(a, b) {
        return (
            a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y
        );
    }

    _resolveOverlap(entity, other, axis, speed) {
        const t = entity.components.Transform;
        const boundsA = this.getBounds(entity);
        const epsilon = 0.01;
        
        let boundsB;
        if (other.components.Tilemap) {
            boundsB = this._getTilemapHitBounds(boundsA, other);
            if (!boundsB) return; 
        } else {
            boundsB = this.getBounds(other);
        }

        if (axis === 'x') {
            if (speed > 0) { 
                const overlap = (boundsA.x + boundsA.w) - boundsB.x;
                t.x -= (overlap + epsilon);
            } else if (speed < 0) { 
                const overlap = (boundsB.x + boundsB.w) - boundsA.x;
                t.x += (overlap + epsilon);
            }
        } else if (axis === 'y') {
            if (speed > 0) { 
                const overlap = (boundsA.y + boundsA.h) - boundsB.y;
                t.y -= (overlap + epsilon);
            } else if (speed < 0) { 
                const overlap = (boundsB.y + boundsB.h) - boundsA.y;
                t.y += (overlap + epsilon);
            }
        }
    }
}