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

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];

            if (!entity.active && !entity.isActive) continue;
            if (!entity.components.Physics || !entity.components.Physics.enabled) continue;
            if (!entity.components.Transform) continue;

            const phys = entity.components.Physics;

            phys.collisionInfo = { hitSolid: null, hitTrigger: null, isGrounded: false };

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
                const hitObject = this.game.colliderSystem.moveAndSlide(entity, dx, dy);
                if (hitObject) {
                    phys.collisionInfo.hitSolid = hitObject;
                }
            }

            this._checkGrounded(entity, phys);
            this._checkTriggers(entity, phys);

            if (phys.isGrounded && phys.velocityY > 0) {
                phys.velocityY = 0;
            }

            if (phys.velocityY < 0 && phys.collisionInfo.hitSolid) {
                phys.velocityY = 0;
            }
        }
    }

    _checkGrounded(entity, physComponent) {
        const colliderSys = this.game.colliderSystem;
        const bounds = colliderSys.getBounds(entity);
        if (!bounds) {
            physComponent.isGrounded = false;
            return;
        }

        const margin = 2; 
        const sensor = {
            x: bounds.x + margin, 
            y: bounds.y + bounds.h, 
            w: bounds.w - (margin * 2), 
            h: 4 
        };

        let isGrounded = false;
        const entities = this.game.world.entities;

        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            if (other === entity) continue;
            if (!other.active && !other.isActive) continue;

            const col = other.components.Collider;
            if (!col || !col.enabled || col.type !== 'solid') continue;

            const otherBounds = colliderSys.getBounds(other);
            if (otherBounds && this._aabbIntersect(sensor, otherBounds)) {
                isGrounded = true;
                break;
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
