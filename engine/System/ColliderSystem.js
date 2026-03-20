export default class ColliderSystem {
    constructor(game) {
        this.game = game;
    }

    moveAndSlide(entity, dx, dy) {
        if (entity.active === false) return null;
        if (!entity.components.Transform) return null;
        
        const collider = entity.components.Collider;
        if (!collider || !collider.data || !collider.data.some(c => c.enabled)) {
            entity.components.Transform.x += dx;
            entity.components.Transform.y += dy;
            return null;
        }

        // FAIL-SAFE: Normalisasi jika entity sudah "stuck" di dalam dinding sebelum bergerak
        // (Biasanya terjadi akibat rotasi mendadak di dekat dinding)
        this._normalizeStuck(entity);

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

    // NORMALISASI RINGAN (Anti-Stuck)
    _normalizeStuck(entity) {
        if (!this._findCollision(entity, 'solid')) return false;

        const t = entity.components.Transform;
        const maxNudge = 12; // Maksimal pixel untuk digeser
        const origX = t.x;
        const origY = t.y;

        // Prioritas dorongan: Atas -> Kiri -> Kanan -> Bawah
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
                
                // Jika sudah tidak nabrak, keluar dari fungsi (posisi ternormalisasi)
                if (!this._findCollision(entity, 'solid')) return true;
            }
        }

        // Jika mentok tidak bisa dinormalisasi, kembalikan ke awal
        t.x = origX;
        t.y = origY;
        return false;
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

    // Tilemap menggunakan OBB vs AABB
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
        
        // Buat AABB kasar dari Collider yang berotasi (Broad-phase)
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
                        pivotX: 0, // TAMBAHKAN INI: Tegaskan bahwa Tilemap menggunakan Top-Left
                        pivotY: 0  // TAMBAHKAN INI
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
                if (!col || !col.data || !col.data.some(c => c.enabled)) continue;
                
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
                if (!col || !col.data || !col.data.some(c => c.enabled)) continue;

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
        const colliderComp = entity.components.Collider;
        if (!t || !colliderComp || !Array.isArray(colliderComp.data)) return [];

        const scaleX = t.scaleX ?? 1;
        const scaleY = t.scaleY ?? 1;
        const tRotRad = (t.rotation || 0) * (Math.PI / 180);
        const cosT = Math.cos(tRotRad);
        const sinT = Math.sin(tRotRad);

        const boundsList = [];

        for (let i = 0; i < colliderComp.data.length; i++) {
            const c = colliderComp.data[i];
            if (!c.enabled) continue; 

            const cW = (c.autoFit ? t.width : c.width) * Math.abs(scaleX);
            const cH = (c.autoFit ? t.height : c.height) * Math.abs(scaleY);
            const pX = c.pivotX ?? 0.5;
            const pY = c.pivotY ?? 0.5;

            // Cari Posisi Kiri-Atas Collider relatif terhadap Pivot Transform
            const localTlX = -t.width * Math.abs(scaleX) * (t.pivotX ?? 0.5) + (c.offsetX || 0) * Math.abs(scaleX);
            const localTlY = -t.height * Math.abs(scaleY) * (t.pivotY ?? 0.5) + (c.offsetY || 0) * Math.abs(scaleY);

            // Cari Posisi Pivot Collider relatif terhadap Pivot Transform
            const localPx = localTlX + cW * pX;
            const localPy = localTlY + cH * pY;

            // Cari Titik Pivot Collider di Dunia Asli
            const worldPx = t.x + localPx * cosT - localPy * sinT;
            const worldPy = t.y + localPx * sinT + localPy * cosT;

            const totalRot = c.autoFit ? tRotRad : tRotRad + ((c.rotation || 0) * (Math.PI / 180));

            boundsList.push({
                x: worldPx,   // SEKARANG X DAN Y ADALAH PIVOT POINT!
                y: worldPy, 
                w: cW, 
                h: cH,
                rotation: totalRot,
                pivotX: pX,
                pivotY: pY,
                type: c.type 
            });
        }
        return boundsList;
    }

    _obbIntersect(a, b) {
        if (!a.rotation && !b.rotation) {
            // KARENA x & y ADALAH PIVOT, KITA GESER KE TOP-LEFT DULU
            const aPx = a.pivotX ?? 0.5;
            const aPy = a.pivotY ?? 0.5;
            const bPx = b.pivotX ?? 0.5;
            const bPy = b.pivotY ?? 0.5;

            const aLeft = a.x - (a.w * aPx);
            const aTop = a.y - (a.h * aPy);
            const bLeft = b.x - (b.w * bPx);
            const bTop = b.y - (b.h * bPy);

            return (
                aLeft < bLeft + b.w &&
                aLeft + a.w > bLeft &&
                aTop < bTop + b.h &&
                aTop + a.h > bTop
            );
        }
        
        const cornersA = this._getObbCorners(a);
        const cornersB = this._getObbCorners(b);
        const axes = [...this._getObbAxes(cornersA), ...this._getObbAxes(cornersB)];
        
        for (let i = 0; i < axes.length; i++) {
            const axis = axes[i];
            const pA = this._project(cornersA, axis);
            const pB = this._project(cornersB, axis);
            if (pA.max <= pB.min || pB.max <= pA.min) return false;
        }
        return true;
    }
    _getObbCorners(b) {
        // b.x dan b.y dari getBounds() SUDAH berupa titik Pivot Dunia (World Pivot)
        const cx = b.x; 
        const cy = b.y;
        const cos = Math.cos(b.rotation || 0);
        const sin = Math.sin(b.rotation || 0);
        
        // Jangkauan (Half-Extents) ditarik dari titik Pivot, bukan titik tengah
        const left = -b.w * (b.pivotX ?? 0.5);
        const right = b.w * (1 - (b.pivotX ?? 0.5));
        const top = -b.h * (b.pivotY ?? 0.5);
        const bottom = b.h * (1 - (b.pivotY ?? 0.5));
        
        return [
            { x: cx + left*cos - top*sin, y: cy + left*sin + top*cos },       // Top-Left
            { x: cx + right*cos - top*sin, y: cy + right*sin + top*cos },     // Top-Right
            { x: cx + right*cos - bottom*sin, y: cy + right*sin + bottom*cos }, // Bottom-Right
            { x: cx + left*cos - bottom*sin, y: cy + left*sin + bottom*cos }  // Bottom-Left
        ];
    }
    _getObbAxes(c) {
        const axes = [
            { x: c[1].x - c[0].x, y: c[1].y - c[0].y },
            { x: c[2].x - c[1].x, y: c[2].y - c[1].y }
        ];
        // Normalisasi Vektor
        for (let i = 0; i < axes.length; i++) {
            const length = Math.sqrt(axes[i].x * axes[i].x + axes[i].y * axes[i].y);
            axes[i].x /= length;
            axes[i].y /= length;
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

    _resolveOverlap(entity, other, axis, speed) {
        const t = entity.components.Transform;
        const boundsAList = this.getBounds(entity).filter(b => b.type === 'solid');
        const epsilon = 0.02; // Tambah sedit margin
        
        let boundsA, boundsB;
        let overlapFound = false;

        for (let bA of boundsAList) {
            if (other.components.Tilemap) {
                let hit = this._getTilemapHitBounds(bA, other);
                if (hit) {
                    boundsA = bA; boundsB = hit; overlapFound = true;
                    break;
                }
            } else {
                const boundsBList = this.getBounds(other).filter(b => b.type === 'solid');
                for (let bB of boundsBList) {
                    if (this._obbIntersect(bA, bB)) {
                        boundsA = bA; boundsB = bB; overlapFound = true;
                        break;
                    }
                }
            }
            if (overlapFound) break;
        }

        if (!overlapFound) return;

        // Bounding Box Kasar untuk membantu menentukan jarak pantul
        const cornersA = this._getObbCorners(boundsA);
        const cornersB = this._getObbCorners(boundsB);
        
        const minXa = Math.min(...cornersA.map(c => c.x)), maxXa = Math.max(...cornersA.map(c => c.x));
        const minYa = Math.min(...cornersA.map(c => c.y)), maxYa = Math.max(...cornersA.map(c => c.y));
        const minXb = Math.min(...cornersB.map(c => c.x)), maxXb = Math.max(...cornersB.map(c => c.x));
        const minYb = Math.min(...cornersB.map(c => c.y)), maxYb = Math.max(...cornersB.map(c => c.y));

        if (axis === 'x') {
            if (speed > 0) { 
                const overlap = maxXa - minXb;
                t.x -= (overlap + epsilon);
            } else if (speed < 0) { 
                const overlap = maxXb - minXa;
                t.x += (overlap + epsilon);
            }
        } else if (axis === 'y') {
            if (speed > 0) { 
                const overlap = maxYa - minYb;
                t.y -= (overlap + epsilon);
            } else if (speed < 0) { 
                const overlap = maxYb - minYa;
                t.y += (overlap + epsilon);
            }
        }
    }
}