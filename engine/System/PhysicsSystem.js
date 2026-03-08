export default class PhysicsSystem {
    constructor(game) {
        this.game = game;
        this.MAX_VELOCITY = 2500;
        this.MIN_MOVE_DISTANCE = 0.001;
    }

    update(dt) {
        const sceneSettings = this.game.world.settings.physics || { gravity: 1200, drag: 5 };
        const GLOBAL_GRAVITY = sceneSettings.gravity;
        const GLOBAL_DRAG = sceneSettings.drag;

        const entities = this.game.world.entities;
        
        const inactiveLayers = this.game.colliderSystem._getInactiveLayers();

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];

            if (entity.active === false || entity.isActive === false) continue;
            if (entity.layerId && inactiveLayers.has(entity.layerId)) continue;
            if (!entity.components.Physics || !entity.components.Physics.enabled) continue;
            if (!entity.components.Transform) continue;

            const phys = entity.components.Physics;

            phys.collisionInfo = { hitSolid: null, hitSolidX: null, hitSolidY: null, hitTrigger: null, isGrounded: false };

            if (phys.gravityScale !== 0) {
                phys.velocityY += GLOBAL_GRAVITY * phys.gravityScale * dt;
            }

            if (phys.drag > 0) {
                const effectiveDrag = GLOBAL_DRAG * phys.drag;
                const damping = Math.max(0, 1 - (effectiveDrag * dt));
                
                phys.velocityX *= damping;

                if (phys.gravityScale === 0) {
                     phys.velocityY *= damping;
                }
            }

            phys.velocityX = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, phys.velocityX));
            phys.velocityY = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, phys.velocityY));

            const dx = phys.velocityX * dt;
            const dy = phys.velocityY * dt;

            if (Math.abs(dx) > this.MIN_MOVE_DISTANCE || Math.abs(dy) > this.MIN_MOVE_DISTANCE) {
                const hitResult = this.game.colliderSystem.moveAndSlide(entity, dx, dy);
                if (hitResult) {
                    phys.collisionInfo.hitSolidX = hitResult.x;
                    phys.collisionInfo.hitSolidY = hitResult.y;
                    phys.collisionInfo.hitSolid = hitResult.x || hitResult.y; 
                }
            }

            this._checkGrounded(entity, phys, inactiveLayers);
            this._checkTriggers(entity, phys);

            if (phys.isGrounded && phys.velocityY > 0) {
                phys.velocityY = 0;
            }

            if (phys.velocityY < 0 && phys.collisionInfo.hitSolidY) {
                phys.velocityY = 0;
            }
        }
    }

    _checkGrounded(entity, physComponent, inactiveLayers) {
        const colliderSys = this.game.colliderSystem;
        const bounds = colliderSys.getBounds(entity);
        if (!bounds) {
            physComponent.isGrounded = false;
            return;
        }

        const inset = 2; 
        const reach = 1; 
        const sensor = {
            x: bounds.x + inset, 
            y: bounds.y + bounds.h, 
            w: bounds.w - (inset * 2), 
            h: reach 
        };

        let isGrounded = false;
        const entities = this.game.world.entities;

        if (!inactiveLayers) {
            inactiveLayers = colliderSys._getInactiveLayers();
        }

        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            if (other === entity) continue;
            
            if (other.active === false || other.isActive === false) continue;
            if (other.layerId && inactiveLayers.has(other.layerId)) continue;

            if (other.components.Tilemap && other.components.Tilemap.isSolid) {
                const hitBounds = colliderSys._getTilemapHitBounds(sensor, other);
                if (hitBounds) {
                    isGrounded = true;
                    break;
                }
            } 
            else {
                const col = other.components.Collider;
                if (!col || !col.enabled || col.type !== 'solid') continue;

                const otherBounds = colliderSys.getBounds(other);
                if (otherBounds && this._aabbIntersect(sensor, otherBounds)) {
                    isGrounded = true;
                    break;
                }
            }
        }

        physComponent.isGrounded = isGrounded;
    }

    _checkTriggers(entity, physComponent) {
        const overlaps = this.game.colliderSystem._findAllCollisions(entity);
        if (overlaps && overlaps.length > 0) {
            const triggerHit = overlaps.find(e => {
                 const c = e.components.Collider;
                 return c && c.type === 'trigger';
            });
            if (triggerHit) physComponent.collisionInfo.hitTrigger = triggerHit;
        }
    }

    _aabbIntersect(a, b) {
        return (
            a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y
        );
    }
}