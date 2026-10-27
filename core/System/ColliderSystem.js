import RenderUtils from "../Renderer/Scene/RenderUtils.js";

export default class ColliderSystem {
    constructor(game) {
        this.game = game;
    }

    isOneWayPlatform(other, oneWayTag) {
        if (!other) return false;
        if (other.components?.Tilemap?.isOneWay || other.components?.Tilemap?.oneWay) return true;
        if (other.components?.Collider?.isOneWay || other.components?.Collider?.oneWay) return true;
        if (!oneWayTag) return false;

        const targets = String(oneWayTag).split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        if (targets.length === 0) return false;

        if (typeof other.hasTag === 'function') {
            if (targets.some(target => other.hasTag(target))) return true;
        }

        const rawTags = Array.isArray(other.tags) 
            ? other.tags 
            : String(other.tag || other.components?.Tags?.value || other.components?.Tilemap?.tag || '').split(',');
        const tags = rawTags.map(t => String(t).trim().toLowerCase()).filter(Boolean);
        return targets.some(target => tags.includes(target));
    }

    moveAndSlide(entity, dx, dy) {
        if (entity.active === false) return null;
        if (!entity.components.Transform) return null;
        
        dx = Number(dx) || 0;
        dy = Number(dy) || 0;

        const boundsList = this.getBounds(entity).filter(b => b.type === 'solid');
        if (boundsList.length === 0) {
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
        const startX = transform.x;
        const startY = transform.y;

        this._currentStepDx = dx;
        this._currentStepDy = dy;

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
                // Any surface with upward-pointing normal (ny < -0.25, up to ~75 deg slope) is a floor (hits.y), NOT a wall!
                if (mtv.axis.y < -0.25) {
                    hits.y = collision;
                } else if (mtv.axis.y > 0.25) {
                    hits.y = collision; // Ceiling
                } else {
                    hits.x = collision; // True wall
                }
            } else {
                break;
            }
            iter++;
        }

        // Auto Step-Climb for small lips, seams, and rough segment joints (<= 8px)
        if (hits.x && Math.abs(dx) > 0.001) {
            const stepUpHeight = 8;
            const blockedX = transform.x;
            const blockedY = transform.y;

            // Test if we can step up over this obstacle
            transform.x = startX;
            transform.y = startY - stepUpHeight;

            // Only attempt if headspace is clear (no ceiling immediately above)
            if (!this._findCollision(entity, 'solid')) {
                // Move forward at the elevated height
                transform.x += dx;
                
                let wallBlocked = false;
                const colHigh = this._findCollision(entity, 'solid');
                if (colHigh) {
                    const mtvHigh = this._resolveOverlap(entity, colHigh);
                    if (mtvHigh && Math.abs(mtvHigh.axis?.x || 0) > 0.6) {
                        wallBlocked = true; // True wall, not a small step
                    }
                }

                if (!wallBlocked) {
                    // Step back down to ground
                    transform.y += stepUpHeight;
                    let groundHit = null;
                    let it = 0;
                    while (it < 4) {
                        const colDown = this._findCollision(entity, 'solid');
                        if (!colDown) break;
                        groundHit = colDown;
                        this._resolveOverlap(entity, colDown);
                        it++;
                    }

                    // Stepped over successfully!
                    hits.x = null;
                    if (groundHit) hits.y = groundHit;
                } else {
                    // Restore blocked state
                    transform.x = blockedX;
                    transform.y = blockedY;
                }
            } else {
                // Restore blocked state
                transform.x = blockedX;
                transform.y = blockedY;
            }
        }

        this._currentStepDx = 0;
        this._currentStepDy = 0;

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

    getColliderShape(entity, scriptId) {
        if (!entity || !entity.components || !entity.components.Collider) return null;
        const shapes = entity.components.Collider.data;
        if (!Array.isArray(shapes)) return null;
        const idLower = String(scriptId).trim().toLowerCase();
        return shapes.find(s => 
            s.scriptId === scriptId ||
            s.id === scriptId ||
            String(s.scriptId || '').toLowerCase() === idLower ||
            String(s.id || '').toLowerCase() === idLower
        ) || null;
    }

    setColliderEnabled(entity, scriptId, enabled = true) {
        const shape = this.getColliderShape(entity, scriptId);
        if (shape) {
            shape.enabled = Boolean(enabled);
            return true;
        }
        return false;
    }

    checkHitbox(attackerEntity, hitboxIdentifier, targetTag = null, targetTypes = null) {
        if (!attackerEntity || attackerEntity.active === false) return [];
        const attackerBounds = this.getBounds(attackerEntity);
        if (attackerBounds.length === 0) return [];

        let hbBound = null;
        if (typeof hitboxIdentifier === 'string') {
            const idLower = String(hitboxIdentifier).trim().toLowerCase();
            hbBound = attackerBounds.find(b =>
                b.scriptId === hitboxIdentifier ||
                b.id === hitboxIdentifier ||
                String(b.scriptId || '').toLowerCase() === idLower ||
                String(b.id || '').toLowerCase() === idLower
            );
        } else if (hitboxIdentifier && typeof hitboxIdentifier === 'object') {
            hbBound = hitboxIdentifier;
        }

        if (!hbBound) {
            hbBound = attackerBounds.find(b => b.type === 'hitbox') || attackerBounds[0];
        }
        if (!hbBound) return [];

        const validTargetTypes = Array.isArray(targetTypes) 
            ? targetTypes 
            : (targetTypes ? [targetTypes] : ['hurtbox', 'solid', 'trigger']);

        const results = [];
        const attackerId = attackerEntity.id || attackerEntity._id;
        const entities = this.game.world?.entities || [];
        const inactiveLayers = this._getInactiveLayers();

        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            const otherId = other.id || other._id;
            if (otherId === attackerId || other.active === false) continue;
            if (other.layerId && inactiveLayers.has(other.layerId)) continue;

            if (targetTag && targetTag.trim() !== '') {
                const targetLower = targetTag.trim().toLowerCase();
                const match = typeof other.hasTag === 'function'
                    ? other.hasTag(targetLower)
                    : (Array.isArray(other.tags)
                        ? other.tags.some(t => String(t).trim().toLowerCase() === targetLower)
                        : String(other.tag || other.components?.Tags?.value || '').trim().toLowerCase() === targetLower);
                if (!match) continue;
            }

            const otherBounds = this.getBounds(other);
            if (otherBounds.length === 0) {
                const oT = other.components && (other.components.Transform || other.components.UITransform);
                if (oT) {
                    const fallbackBound = {
                        x: oT.x,
                        y: oT.y,
                        w: (oT.width || 32) * Math.abs(oT.scaleX ?? 1),
                        h: (oT.height || 32) * Math.abs(oT.scaleY ?? 1),
                        rotation: (oT.rotation || 0) * (Math.PI / 180),
                        pivotX: oT.pivotX ?? 0.5,
                        pivotY: oT.pivotY ?? 0.5,
                        cornerRadius: 0,
                        type: 'hurtbox'
                    };
                    if (this._obbIntersect(hbBound, fallbackBound)) {
                        results.push({ entity: other, targetBound: fallbackBound, attackerBound: hbBound });
                    }
                }
                continue;
            }

            for (const bB of otherBounds) {
                if (validTargetTypes.length > 0 && !validTargetTypes.includes(bB.type)) {
                    continue;
                }
                if (this._obbIntersect(hbBound, bB)) {
                    results.push({ entity: other, targetBound: bB, attackerBound: hbBound });
                    break;
                }
            }
        }

        return results;
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
        const tm = tilemapEntity?.components?.Tilemap;
        if (!tm || !tm.data) return null;

        const tileW = Number(tm.width || tm.tileWidth) || 32;
        const tileH = Number(tm.height || tm.tileHeight) || 32;
        if (tileW <= 0 || tileH <= 0) return null;

        const tf = RenderUtils ? RenderUtils.getGlobalTransform(tilemapEntity, this.game?.world) : (tilemapEntity.components?.Transform || { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });
        const scaleX = (tf.flipX ? -1 : 1) * (tf.scaleX ?? 1);
        const scaleY = (tf.flipY ? -1 : 1) * (tf.scaleY ?? 1);
        if (scaleX === 0 || scaleY === 0) return null;

        const rotRad = (tf.rotation || 0) * (Math.PI / 180);
        const cosR = Math.cos(rotRad);
        const sinR = Math.sin(rotRad);

        const scaledTileW = tileW * scaleX;
        const scaledTileH = tileH * scaleY;
        const absTileW = Math.abs(scaledTileW);
        const absTileH = Math.abs(scaledTileH);

        const corners = this._getObbCorners(boundsA);
        if (!corners || corners.length === 0) return null;

        let minLocalX = Infinity;
        let maxLocalX = -Infinity;
        let minLocalY = Infinity;
        let maxLocalY = -Infinity;

        for (let i = 0; i < corners.length; i++) {
            const c = corners[i];
            const dx = c.x - tf.x;
            const dy = c.y - tf.y;
            const lx = (dx * cosR) + (dy * sinR);
            const ly = (-dx * sinR) + (dy * cosR);

            if (lx < minLocalX) minLocalX = lx;
            if (lx > maxLocalX) maxLocalX = lx;
            if (ly < minLocalY) minLocalY = ly;
            if (ly > maxLocalY) maxLocalY = ly;
        }

        let minGx, maxGx, minGy, maxGy;
        if (scaledTileW > 0) {
            minGx = Math.floor(minLocalX / scaledTileW);
            maxGx = Math.floor(maxLocalX / scaledTileW);
        } else {
            minGx = Math.floor(maxLocalX / scaledTileW);
            maxGx = Math.floor(minLocalX / scaledTileW);
        }

        if (scaledTileH > 0) {
            minGy = Math.floor(minLocalY / scaledTileH);
            maxGy = Math.floor(maxLocalY / scaledTileH);
        } else {
            minGy = Math.floor(maxLocalY / scaledTileH);
            maxGy = Math.floor(minLocalY / scaledTileH);
        }

        let bestHit = null;
        let maxOverlap = -1;

        for (let gy = minGy; gy <= maxGy; gy++) {
            for (let gx = minGx; gx <= maxGx; gx++) {
                const key = `${gx},${gy}`;
                let tileId = 0;
                if (Array.isArray(tm.data)) {
                    const cols = Number(tm.cols || tm.columns) || 0;
                    if (cols > 0 && gx >= 0 && gx < cols && gy >= 0) {
                        tileId = tm.data[gy * cols + gx] || 0;
                    }
                } else if (tm.data && typeof tm.data === 'object') {
                    tileId = tm.data[key] || 0;
                }

                if (!tileId || tileId <= 0) continue;

                const x1 = gx * scaledTileW;
                const x2 = (gx + 1) * scaledTileW;
                const y1 = gy * scaledTileH;
                const y2 = (gy + 1) * scaledTileH;

                const lxMin = Math.min(x1, x2);
                const lyMin = Math.min(y1, y2);

                const dstX = tf.x + (lxMin * cosR - lyMin * sinR);
                const dstY = tf.y + (lxMin * sinR + lyMin * cosR);

                const tileBounds = {
                    x: dstX,
                    y: dstY,
                    w: absTileW,
                    h: absTileH,
                    rotation: rotRad,
                    pivotX: 0,
                    pivotY: 0,
                    type: 'solid'
                };

                const hit = this._obbIntersect(boundsA, tileBounds);
                if (hit) {
                    if (hit.overlap > maxOverlap) {
                        maxOverlap = hit.overlap;
                        bestHit = tileBounds;
                    }
                }
            }
        }

        return bestHit;
    }

    _findCollision(entity, requiredType = null, targetTag = null) {
        const boundsAList = this.getBounds(entity);
        if (boundsAList.length === 0) return null;

        const currentId = entity.id || entity._id;
        const currentName = entity.scriptId || currentId;
        const entities = this.game.world.entities;
        const inactiveLayers = this._getInactiveLayers();

        const oneWayTag = entity._oneWayTag || entity.components?.Physics?._oneWayTag;
        const isDropping = Boolean((entity._dropThroughTimer > 0) || (entity.components?.Physics?._dropThroughTimer > 0));
        const phys = entity.components?.Physics;
        const isMovingUp = Boolean((phys && phys.velocityY < -0.01) || (this._currentStepDy !== undefined && this._currentStepDy < -0.001));

        let currFeetY = -Infinity;
        const solidBoundsA = boundsAList.filter(b => b.type === 'solid');
        if (solidBoundsA.length > 0) {
            for (let b of solidBoundsA) {
                const c = this._getObbCorners(b);
                const maxCy = Math.max(...c.map(pt => pt.y));
                if (maxCy > currFeetY) currFeetY = maxCy;
            }
        }
        const stepDy = this._currentStepDy || 0;
        const prevFeetY = currFeetY - stepDy;

        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            const otherId = other.id || other._id;
            const otherName = other.scriptId || otherId;
            
            if (otherId === currentId) continue;
            if (other.active === false) continue;
            if (other.layerId && inactiveLayers.has(other.layerId)) continue;
            
            if (targetTag && targetTag.trim() !== "") {
                const targetLower = targetTag.trim().toLowerCase();
                const match = typeof other.hasTag === 'function'
                    ? other.hasTag(targetLower)
                    : (Array.isArray(other.tags)
                        ? other.tags.some(t => String(t).trim().toLowerCase() === targetLower)
                        : String(other.tag || other.components?.Tags?.value || '').trim().toLowerCase() === targetLower);
                if (!match) continue; 
            }

            const isOneWay = Boolean(oneWayTag && this.isOneWayPlatform(other, oneWayTag));

            if (isOneWay) {
                if (isDropping || isMovingUp) {
                    continue;
                }
            }

            if (other.components.Tilemap && other.components.Tilemap.isSolid) {
                if (requiredType !== null && requiredType !== 'solid') continue;
                
                for (let bA of boundsAList) {
                    if (requiredType !== null && bA.type !== requiredType) continue;
                    const hitBounds = this._getTilemapHitBounds(bA, other);
                    if (hitBounds) {
                        if (isOneWay) {
                            const tbCorners = this._getObbCorners(hitBounds);
                            const platformTopY = Math.min(...tbCorners.map(c => c.y));
                            const tolerance = Math.max(6, Math.abs(stepDy) + 2);
                            if (prevFeetY > platformTopY + tolerance) {
                                continue;
                            }
                            const intersect = this._obbIntersect(bA, hitBounds);
                            if (!intersect || (intersect.axis && intersect.axis.y >= -0.25)) {
                                continue;
                            }
                        }
                        console.log(`[ColliderSystem] Collision (Tilemap${isOneWay ? ' One-Way' : ''}): '${currentName}' collided with '${otherName}'`);
                        return other;
                    }
                }
            } else {
                const boundsBList = this.getBounds(other);
                if (boundsBList.length === 0) continue;

                for (let bA of boundsAList) {
                    if (requiredType !== null && bA.type !== requiredType) continue;
                    for (let bB of boundsBList) {
                        if (requiredType !== null && bB.type !== requiredType) continue;
                        if (this._obbIntersect(bA, bB)) {
                            if (isOneWay) {
                                const bBCorners = this._getObbCorners(bB);
                                const platformTopY = Math.min(...bBCorners.map(c => c.y));
                                const tolerance = Math.max(6, Math.abs(stepDy) + 2);
                                if (prevFeetY > platformTopY + tolerance) {
                                    continue;
                                }
                                const intersect = this._obbIntersect(bA, bB);
                                if (!intersect || (intersect.axis && intersect.axis.y >= -0.25)) {
                                    continue;
                                }
                            }
                            console.log(`[ColliderSystem] Collision detected${isOneWay ? ' (One-Way)' : ''}: '${currentName}' (${currentId}) <---> '${otherName}' (${otherId})`);
                            return other;
                        }
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
        const currentName = entity.scriptId || currentId;
        const entities = this.game.world.entities;
        const inactiveLayers = this._getInactiveLayers();

        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            const otherId = other.id || other._id;
            const otherName = other.scriptId || otherId;

            if (otherId === currentId) continue;
            if (other.active === false) continue;
            if (other.layerId && inactiveLayers.has(other.layerId)) continue;

            if (targetTag && targetTag.trim() !== "") {
                const targetLower = targetTag.trim().toLowerCase();
                const match = typeof other.hasTag === 'function'
                    ? other.hasTag(targetLower)
                    : (Array.isArray(other.tags)
                        ? other.tags.some(t => String(t).trim().toLowerCase() === targetLower)
                        : String(other.tag || other.components?.Tags?.value || '').trim().toLowerCase() === targetLower);
                if (!match) continue; 
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

            if (collided) {
                console.log(`[ColliderSystem] Overlap/Collision Found: '${currentName}' collided with '${otherName}'`);
                results.push(other);
            }
        }
        return results;
    }

    getBounds(entity) {
        const t = entity.components.Transform;
        if (!t) return [];

        const boundsList = [];
        const isFlippedX = Boolean(t.flipX || (entity.components?.Physics?.facingDirection === 'left'));
        const scaleX = (t.scaleX ?? 1) * (t.flipX ? -1 : 1);
        const scaleY = (t.scaleY ?? 1) * (t.flipY ? -1 : 1);
        const tRotRad = (t.rotation || 0) * (Math.PI / 180) * (isFlippedX ? -1 : 1);
        const cosT = Math.cos(tRotRad);
        const sinT = Math.sin(tRotRad);

        const entityW = t.width || 32;
        const entityH = t.height || 32;

        const colliderComp = entity.components.Collider;
        if (colliderComp && Array.isArray(colliderComp.data)) {
            for (let i = 0; i < colliderComp.data.length; i++) {
                const c = colliderComp.data[i];
                if (!c.enabled) continue; 

                const cW = (c.autoFit ? entityW : c.width) * Math.abs(scaleX);
                const cH = (c.autoFit ? entityH : c.height) * Math.abs(scaleY);
                let pX = c.pivotX ?? 0.5;
                let pY = c.pivotY ?? 0.5;

                const localTlX = -entityW * Math.abs(scaleX) * (t.pivotX ?? 0.5) + (c.offsetX || 0) * Math.abs(scaleX);
                const localTlY = -entityH * Math.abs(scaleY) * (t.pivotY ?? 0.5) + (c.offsetY || 0) * Math.abs(scaleY);

                let localPx = localTlX + cW * pX;
                let localPy = localTlY + cH * pY;

                const shouldFlipX = isFlippedX && (c.autoFlipX !== false);
                if (shouldFlipX) {
                    localPx = -localPx;
                    pX = 1 - pX;
                }

                const isLockRot = Boolean(c.lockWorldRotation);
                const worldPx = isLockRot ? (t.x + localPx) : (t.x + localPx * cosT - localPy * sinT);
                const worldPy = isLockRot ? (t.y + localPy) : (t.y + localPx * sinT + localPy * cosT);

                let totalRot = isLockRot 
                    ? ((c.rotation || 0) * (Math.PI / 180) * (shouldFlipX ? -1 : 1)) 
                    : (c.autoFit ? tRotRad : tRotRad + (((c.rotation || 0) * (Math.PI / 180)) * (shouldFlipX ? -1 : 1)));

                const cRadius = Math.max(0, Math.min(
                    (Number(c.cornerRadius) || 0) * Math.min(Math.abs(scaleX), Math.abs(scaleY)),
                    cW * 0.5,
                    cH * 0.5
                ));

                boundsList.push({
                    x: worldPx, 
                    y: worldPy, 
                    w: cW, 
                    h: cH,
                    rotation: totalRot,
                    pivotX: pX,
                    pivotY: pY,
                    cornerRadius: cRadius,
                    type: c.type || 'solid',
                    id: c.id,
                    scriptId: c.scriptId,
                    shape: c
                });
            }
        }

        const shapeComp = entity.components.ShapeRenderer;
        if (shapeComp && shapeComp.elements) {
            const enablePoly = Boolean(shapeComp.enablePolygonCollision);
            const enableSeg = Boolean(shapeComp.enableSegmentCollision);
            const enableCircle = Boolean(shapeComp.enableCircleCollision);

            if (enablePoly || enableSeg || enableCircle) {
                const pointMap = new Map();
                for (const el of shapeComp.elements) {
                    if (el.type === 'point') pointMap.set(el.id, el);
                }

                const absScaleX = (entityW / 100) * scaleX;
                const absScaleY = (entityH / 100) * scaleY;

                const toWorld = (lx, ly) => {
                    const dx = lx * absScaleX;
                    const dy = ly * absScaleY;
                    return {
                        x: t.x + (dx * cosT - dy * sinT),
                        y: t.y + (dx * sinT + dy * cosT)
                    };
                };

                for (const el of shapeComp.elements) {
                    if (el.enabled === false) continue;

                    if (enablePoly && el.type === 'polygon') {
                        const pts = (el.points || []).map(id => pointMap.get(id)).filter(Boolean);
                        if (pts.length >= 3) {
                            boundsList.push({ 
                                type: 'solid', 
                                vertices: pts.map(p => toWorld(p.x, p.y)) 
                            });
                        }
                    }

                    if (enableSeg) {
                        if (el.type === 'segment') {
                            const pts = (el.points || []).map(id => pointMap.get(id)).filter(Boolean);
                            for (let k = 0; k < pts.length - 1; k++) {
                                boundsList.push({
                                    type: 'solid',
                                    vertices: [toWorld(pts[k].x, pts[k].y), toWorld(pts[k+1].x, pts[k+1].y)]
                                });
                            }
                        } else if (el.type === 'line') {
                            const p1 = pointMap.get(el.p1);
                            const p2 = pointMap.get(el.p2);
                            if (p1 && p2) {
                                boundsList.push({ 
                                    type: 'solid', 
                                    vertices: [toWorld(p1.x, p1.y), toWorld(p2.x, p2.y)] 
                                });
                            }
                        }
                    }

                    if (enableCircle && el.type === 'circle') {
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

        const cornersA = isCircleA ? [] : (a.cornerRadius > 0 ? this._getInnerCorners(a) : this._getObbCorners(a));
        const cornersB = isCircleB ? [] : (b.cornerRadius > 0 ? this._getInnerCorners(b) : this._getObbCorners(b));

        const isSegmentA = cornersA.length === 2;
        const isSegmentB = cornersB.length === 2;
        const segmentCorners = isSegmentB ? cornersB : (isSegmentA ? cornersA : null);
        let segmentFloorNormal = null;

        if (segmentCorners) {
            const p1 = segmentCorners[0];
            const p2 = segmentCorners[1];
            const sx = p2.x - p1.x;
            const sy = p2.y - p1.y;
            const slen = Math.hypot(sx, sy) || 1;
            let nx = -sy / slen;
            let ny = sx / slen;
            if (ny > 0) { nx = -nx; ny = -ny; }
            if (ny < -0.2) {
                segmentFloorNormal = { x: nx, y: ny };
            }
        }
        
        const axes = [...this._getObbAxes(cornersA), ...this._getObbAxes(cornersB)];
        
        if (isCircleA && cornersB.length > 0) {
            const axis = this._getCircleToPolygonAxis(a, cornersB);
            if (axis) axes.push(axis);
        }
        if (isCircleB && cornersA.length > 0) {
            const axis = this._getCircleToPolygonAxis(b, cornersA);
            if (axis) axes.push(axis);
        }

        if (a.cornerRadius > 0 && cornersB.length > 0) {
            for (let i = 0; i < cornersA.length; i++) {
                const axis = this._getCircleToPolygonAxis(cornersA[i], cornersB);
                if (axis) axes.push(axis);
            }
        }
        if (b.cornerRadius > 0 && cornersA.length > 0) {
            for (let i = 0; i < cornersB.length; i++) {
                const axis = this._getCircleToPolygonAxis(cornersB[i], cornersA);
                if (axis) axes.push(axis);
            }
        }

        let minOverlap = Infinity;
        let smallestAxis = null;

        for (let i = 0; i < axes.length; i++) {
            const axis = axes[i];
            const pA = this._projectShape(a, cornersA, axis);
            const pB = this._projectShape(b, cornersB, axis);
            
            if (pA.max <= pB.min || pB.max <= pA.min) return false;
            
            // Ghost collision prevention: Floor segments must never select horizontal wall axes (|axis.y| < 0.2)
            if (segmentFloorNormal && Math.abs(axis.y) < 0.2) {
                continue;
            }

            const overlap = Math.min(pA.max - pB.min, pB.max - pA.min);
            if (overlap < minOverlap) {
                minOverlap = overlap;
                smallestAxis = axis;
            }
        }

        // For floor segments, always prioritize pushing along the segment's upward floor normal
        if (segmentFloorNormal) {
            smallestAxis = segmentFloorNormal;
            const pA = this._projectShape(a, cornersA, smallestAxis);
            const pB = this._projectShape(b, cornersB, smallestAxis);
            minOverlap = Math.min(pA.max - pB.min, pB.max - pA.min);
        }

        if (!smallestAxis) return false;

        if (segmentFloorNormal) {
            // A floor segment must always push the colliding entity upwards out of the ground
            if (isSegmentB) {
                if (smallestAxis.y > 0) {
                    smallestAxis = { x: -smallestAxis.x, y: -smallestAxis.y };
                }
            } else {
                if (smallestAxis.y < 0) {
                    smallestAxis = { x: -smallestAxis.x, y: -smallestAxis.y };
                }
            }
        } else {
            const cxA = isCircleA ? a.x : cornersA.reduce((sum, c) => sum + c.x, 0) / (cornersA.length || 1);
            const cyA = isCircleA ? a.y : cornersA.reduce((sum, c) => sum + c.y, 0) / (cornersA.length || 1);
            
            const cxB = isCircleB ? b.x : cornersB.reduce((sum, c) => sum + c.x, 0) / (cornersB.length || 1);
            const cyB = isCircleB ? b.y : cornersB.reduce((sum, c) => sum + c.y, 0) / (cornersB.length || 1);

            const dx = cxA - cxB;
            const dy = cyA - cyB;

            if (smallestAxis && (dx * smallestAxis.x + dy * smallestAxis.y < 0)) {
                smallestAxis.x *= -1;
                smallestAxis.y *= -1;
            }
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

        if (shape.cornerRadius > 0) {
            return { 
                min: min - shape.cornerRadius, 
                max: max + shape.cornerRadius 
            };
        }

        return { min, max };
    }

    _getInnerCorners(b) {
        const r = b.cornerRadius || 0;
        if (r <= 0) return this._getObbCorners(b);

        const cx = b.x; 
        const cy = b.y;
        const cos = Math.cos(b.rotation || 0);
        const sin = Math.sin(b.rotation || 0);
        
        const left = -b.w * (b.pivotX ?? 0.5) + r;
        const right = b.w * (1 - (b.pivotX ?? 0.5)) - r;
        const top = -b.h * (b.pivotY ?? 0.5) + r;
        const bottom = b.h * (1 - (b.pivotY ?? 0.5)) - r;
        
        return [
            { x: cx + left*cos - top*sin, y: cy + left*sin + top*cos },      
            { x: cx + right*cos - top*sin, y: cy + right*sin + top*cos },   
            { x: cx + right*cos - bottom*sin, y: cy + right*sin + bottom*cos }, 
            { x: cx + left*cos - bottom*sin, y: cy + left*sin + bottom*cos }
        ];
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
            }
        }
        return axes;
    }

    _resolveOverlap(entity, other) {
        const t = entity.components.Transform;
        const boundsAList = this.getBounds(entity).filter(b => b.type === 'solid');
        
        let mtv = null;

        for (let bA of boundsAList) {
            if (other.components.Tilemap && Boolean(other.components.Tilemap.isSolid)) {
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

        if (!mtv || !mtv.axis || !Number.isFinite(mtv.overlap)) return null;

        const oneWayTag = entity._oneWayTag || entity.components?.Physics?._oneWayTag;
        const isOneWay = Boolean(oneWayTag && this.isOneWayPlatform(other, oneWayTag));

        if (isOneWay) {
            const isDropping = Boolean((entity._dropThroughTimer > 0) || (entity.components?.Physics?._dropThroughTimer > 0));
            const isMovingUp = Boolean((entity.components?.Physics?.velocityY < -0.01) || (this._currentStepDy !== undefined && this._currentStepDy < -0.001));
            if (isDropping || isMovingUp) {
                return null;
            }
            // One-way platforms only act as floors (pushing up), never walls or ceilings
            if (mtv.axis.y >= -0.25) {
                return null;
            }
        }

        // Walkable floor or slope: normal points upward (axis.y < -0.25, up to ~75 deg)
        // Resolve purely vertically so horizontal walking velocity is never pushed backwards uphill!
        if (mtv.axis.y < -0.25) {
            const verticalPush = -(mtv.overlap + 0.005) / Math.abs(mtv.axis.y);
            const clampedPushY = Math.max(-24, Math.min(0, verticalPush));
            if (Number.isFinite(clampedPushY)) t.y += clampedPushY;
        } else {
            const pushX = (Number(mtv.axis.x) || 0) * (mtv.overlap + 0.005);
            const pushY = (Number(mtv.axis.y) || 0) * (mtv.overlap + 0.005);
            if (Number.isFinite(pushX)) t.x += pushX;
            if (Number.isFinite(pushY)) t.y += pushY;
        }
        
        return mtv;
    }
}