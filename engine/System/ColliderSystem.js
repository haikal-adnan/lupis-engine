export default class ColliderSystem {
    constructor(game) {
        this.game = game;
    }

    moveAndSlide(entity, dx, dy) {
        if (!entity.components.Transform) return null;
        const collider = entity.components.Collider;
        if (!collider || !collider.enabled) {
            entity.components.Transform.x += dx;
            entity.components.Transform.y += dy;
            return null;
        }
        const MAX_STEP_SIZE = 8;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 0.001) return null;
        const steps = Math.ceil(distance / MAX_STEP_SIZE);
        const stepX = dx / steps;
        const stepY = dy / steps;
        let finalHit = null;
        for (let i = 0; i < steps; i++) {
            const hit = this._moveSingleStep(entity, stepX, stepY);
            if (hit) finalHit = hit;
        }
        return finalHit;
    }

    _moveSingleStep(entity, dx, dy) {
        const transform = entity.components.Transform;
        let hitObject = null;
        if (Math.abs(dx) > 0.0001) {
            transform.x += dx;
            const collisionX = this._findCollision(entity, 'solid');
            if (collisionX) {
                this._resolveOverlap(entity, collisionX, 'x', dx);
                hitObject = collisionX;
            }
        }
        if (Math.abs(dy) > 0.0001) {
            transform.y += dy;
            const collisionY = this._findCollision(entity, 'solid');
            if (collisionY) {
                this._resolveOverlap(entity, collisionY, 'y', dy);
                hitObject = hitObject || collisionY;
            }
        }
        return hitObject;
    }

    checkSolid(entity) {
        return this._findCollision(entity, 'solid');
    }

    checkOverlap(entity, targetTag = null) {
        const overlaps = this._findAllCollisions(entity, null, targetTag);
        if (overlaps.length === 0) return null;
        const dynamicEntity = overlaps.find(e => !e.components.Tilemap);
        if (dynamicEntity) {
            return dynamicEntity;
        }
        return overlaps[0];
    }

    _findCollision(entity, requiredType = null, targetTag = null) {
        const boundsA = this.getBounds(entity);
        if (!boundsA) return null;
        const currentId = entity.id || entity._id;
        const entities = this.game.world.entities;
        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            const otherId = other.id || other._id;
            if (otherId === currentId) continue;
            if (!other.active && !other.isActive) continue;
            const col = other.components.Collider;
            if (!col || !col.enabled) continue;
            if (requiredType !== null && col.type !== requiredType) continue;
            if (targetTag && targetTag.trim() !== "") {
                const otherTag = other.tag || other.components?.Tags?.value;
                if (otherTag !== targetTag) continue;
            }
            const boundsB = this.getBounds(other);
            if (boundsB && this._aabbIntersect(boundsA, boundsB)) return other;
        }
        return null;
    }

    _findAllCollisions(entity, requiredType = null, targetTag = null) {
        const results = [];
        const boundsA = this.getBounds(entity);
        if (!boundsA) return results;
        const currentId = entity.id || entity._id;
        const entities = this.game.world.entities;
        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            const otherId = other.id || other._id;
            if (otherId === currentId) continue;
            if (!other.active && !other.isActive) continue;
            const col = other.components.Collider;
            if (!col || !col.enabled) continue;
            if (requiredType !== null && col.type !== requiredType) continue;
            if (targetTag && targetTag.trim() !== "") {
                const otherTag = other.tag || other.components?.Tags?.value;
                if (otherTag !== targetTag) continue;
            }
            const boundsB = this.getBounds(other);
            if (boundsB && this._aabbIntersect(boundsA, boundsB)) {
                results.push(other);
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
        const scaleX = t.scaleX || 1;
        const scaleY = t.scaleY || 1;
        const visualWidth = t.width * Math.abs(scaleX);
        const visualHeight = t.height * Math.abs(scaleY);
        const originX = t.x - visualWidth * pX;
        const originY = t.y - visualHeight * pY;
        return {
            x: originX + (c.offsetX || 0),
            y: originY + (c.offsetY || 0),
            w: c.width,
            h: c.height
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
        const boundsB = this.getBounds(other);
        const epsilon = 0.1;
        if (axis === 'x') {
            if (speed > 0) {
                const overlap = boundsA.x + boundsA.w - boundsB.x;
                t.x -= overlap + epsilon;
            } else if (speed < 0) {
                const overlap = boundsB.x + boundsB.w - boundsA.x;
                t.x += overlap + epsilon;
            }
        } else if (axis === 'y') {
            if (speed > 0) {
                const overlap = boundsA.y + boundsA.h - boundsB.y;
                t.y -= overlap + epsilon;
            } else if (speed < 0) {
                const overlap = boundsB.y + boundsB.h - boundsA.y;
                t.y += overlap + epsilon;
            }
        }
    }
}
