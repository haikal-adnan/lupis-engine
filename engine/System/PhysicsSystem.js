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

            if (entity.active === false) continue;
            if (entity.layerId && inactiveLayers.has(entity.layerId)) continue;
            if (!entity.components.Physics || !entity.components.Physics.enabled) continue;
            if (!entity.components.Transform) continue;

            const phys = entity.components.Physics;

            phys.collisionInfo = { hitSolid: null, hitSolidX: null, hitSolidY: null, hitTrigger: null };

            const preDragVelocityX = phys.velocityX;

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

            if (phys._isIntentionalMove === undefined) {
                phys._isIntentionalMove = Math.abs(preDragVelocityX) > 10;
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

            if (phys.gravityScale !== 0) {
                this._checkGrounded(entity, phys, inactiveLayers);
            } else {
                phys.isGrounded = true;
            }

            this._checkTriggers(entity, phys);

            if (phys.gravityScale !== 0) {
                if (phys.isGrounded && phys.velocityY > 0) {
                    phys.velocityY = 0;
                }
                if (phys.velocityY < 0 && phys.collisionInfo.hitSolidY) {
                    phys.velocityY = 0;
                }
            } else {
                if (phys.collisionInfo.hitSolidY) phys.velocityY = 0;
                if (phys.collisionInfo.hitSolidX) phys.velocityX = 0;
            }

            this._updateMovementState(phys);
        }
    }

    _updateMovementState(phys) {
        const isTopDown = phys.gravityScale === 0;

        if (isTopDown) {
            if (phys._isIntentionalMove || Math.abs(phys.velocityX) > 50 || Math.abs(phys.velocityY) > 50) {
                phys.movementState = "running";
            } else {
                phys.movementState = "idle";
            }
            phys.isGrounded = true;
        } else {
            if (phys.isGrounded) {
                if (phys._isIntentionalMove || Math.abs(phys.velocityX) > 50) {
                    phys.movementState = "running";
                } else {
                    phys.movementState = "idle";
                }
            } else {
                if (phys.velocityY < 0) {
                    phys.movementState = "jumping";
                } else {
                    phys.movementState = "falling";
                }
            }
        }
    }

    _checkGrounded(entity, physComponent, inactiveLayers) {
        const colliderSys = this.game.colliderSystem;
        const boundsList = colliderSys.getBounds(entity).filter(b => b.type === 'solid');

        if (boundsList.length === 0) {
            physComponent.isGrounded = false;
            return;
        }

        let isGrounded = false;
        const entities = this.game.world.entities;

        if (!inactiveLayers) {
            inactiveLayers = colliderSys._getInactiveLayers();
        }

        for (let bA of boundsList) {
            const corners = colliderSys._getObbCorners(bA);
            const bottomY = Math.max(...corners.map(c => c.y));
            const minX = Math.min(...corners.map(c => c.x));
            const maxX = Math.max(...corners.map(c => c.x));
            const w = maxX - minX;

            const inset = 2;
            const reach = 2;
            const sensor = {
                x: minX + inset,
                y: bottomY,
                w: w - (inset * 2),
                h: reach,
                rotation: 0,
                pivotX: 0,
                pivotY: 0
            };

            for (let i = 0; i < entities.length; i++) {
                const other = entities[i];
                if (other === entity || other.active === false) continue;
                if (other.layerId && inactiveLayers.has(other.layerId)) continue;

                if (other.components.Tilemap && other.components.Tilemap.isSolid) {
                    const hitBounds = colliderSys._getTilemapHitBounds(sensor, other);
                    if (hitBounds) {
                        isGrounded = true;
                        break;
                    }
                } else {
                    const col = other.components.Collider;
                    if (!col || !col.data || !col.data.some(c => c.enabled)) continue;

                    const otherBounds = colliderSys.getBounds(other).filter(b => b.type === 'solid');
                    for (let bB of otherBounds) {
                        if (colliderSys._obbIntersect(sensor, bB)) {
                            isGrounded = true;
                            break;
                        }
                    }
                }
                if (isGrounded) break;
            }
            if (isGrounded) break;
        }

        physComponent.isGrounded = isGrounded;
    }

    _checkTriggers(entity, physComponent) {
        const overlaps = this.game.colliderSystem._findAllCollisions(entity);
        if (overlaps && overlaps.length > 0) {
            const triggerHit = overlaps.find(e => {
                const c = e.components.Collider;
                return c && c.data && c.data.some(col => col.enabled && col.type === 'trigger');
            });
            if (triggerHit) physComponent.collisionInfo.hitTrigger = triggerHit;
        }
    }
}