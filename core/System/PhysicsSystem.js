export default class PhysicsSystem {
    constructor(game) {
        this.game = game;
        this.MAX_VELOCITY = 2500;
        this.MIN_MOVE_DISTANCE = 0.001;
    }

    update(dt) {
        if (this.game.isPaused) return;

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

            if (phys.isFrozen) continue;

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

            const wasGrounded = Boolean(phys.isGrounded);
            phys._wasGrounded = wasGrounded;

            // Rest on slope/floor (Godot floor_stop_on_slope pattern):
            // When already grounded and at rest, zero vertical velocity so gravity doesn't push down into ground every frame
            if (wasGrounded && phys.isGrounded && phys.velocityY >= 0 && Math.abs(phys.velocityX) < 5) {
                phys.velocityY = 0;
            }

            const baseDx = phys.velocityX * dt;
            let dx = baseDx;
            let dy = phys.velocityY * dt;

            // Constant speed along slope: project horizontal velocity along slope tangent
            const maxAngle = typeof phys.maxSlopeAngle === 'number' && phys.maxSlopeAngle > 0 ? phys.maxSlopeAngle : 60;
            if (wasGrounded && phys.alignToSlope && phys.groundAngle && phys.velocityY >= 0 && Math.abs(phys.groundAngle) <= maxAngle && Math.abs(phys.velocityX) > 5) {
                const angleRad = (phys.groundAngle * Math.PI) / 180;
                const cos = Math.cos(angleRad);
                const sin = Math.sin(angleRad);
                
                // Total speed along slope surface is kept constant: sqrt(dx^2 + dy^2) = |baseDx|
                dx = baseDx * cos;
                dy = baseDx * sin;
            }

            if (Math.abs(dx) > this.MIN_MOVE_DISTANCE || Math.abs(dy) > this.MIN_MOVE_DISTANCE) {
                const hitResult = this.game.colliderSystem.moveAndSlide(entity, dx, dy);
                if (hitResult) {
                    phys.collisionInfo.hitSolidX = hitResult.x;
                    phys.collisionInfo.hitSolidY = hitResult.y;
                    phys.collisionInfo.hitSolid = hitResult.x || hitResult.y;
                    
                    if (hitResult.normals && hitResult.normals.length > 0) {
                        for (let j = 0; j < hitResult.normals.length; j++) {
                            const n = hitResult.normals[j];
                            const isWalkableFloor = n.y < -0.25; // slope normal pointing mostly up (< ~75 deg)

                            if (isWalkableFloor) {
                                // For floors and walkable slopes, only cancel downward velocity
                                if (phys.velocityY > 0) {
                                    phys.velocityY = 0;
                                }
                                phys._lastSlideNormal = { x: n.x, y: n.y };
                            } else {
                                // For walls and ceilings, cancel velocity into the obstacle
                                const dot = phys.velocityX * n.x + phys.velocityY * n.y;
                                if (dot < 0) {
                                    phys.velocityX -= dot * n.x;
                                    phys.velocityY -= dot * n.y;
                                }
                            }
                        }
                    }
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
            }

            if (phys.alignToSlope) {
                this._updateSlopeAlignment(entity, phys, dt);
            }

            this._updateMovementState(phys, dt);
        }
    }

    _updateMovementState(phys, dt) {
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
                phys._groundedGraceTimer = 0.12; // 120ms coyote grace window
                if (phys._isIntentionalMove || Math.abs(phys.velocityX) > 50) {
                    phys.movementState = "running";
                } else {
                    phys.movementState = "idle";
                }
            } else {
                // If recently grounded and moving downward (e.g. running down a slope), prevent flickering to falling
                if (phys._groundedGraceTimer > 0 && phys.velocityY >= 0) {
                    phys._groundedGraceTimer -= dt;
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
    }

    _checkGrounded(entity, physComponent, inactiveLayers) {
        const colliderSys = this.game.colliderSystem;
        const boundsList = colliderSys.getBounds(entity).filter(b => b.type === 'solid');

        if (boundsList.length === 0) {
            physComponent.isGrounded = false;
            physComponent.groundAngle = 0;
            physComponent.groundNormal = { x: 0, y: -1 };
            return;
        }

        let isGrounded = false;
        let groundAngle = 0;
        let groundNormal = { x: 0, y: -1 };
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

            const inset = bA.cornerRadius > 0 ? Math.min(bA.cornerRadius * 0.8, w * 0.4) : 2;
            const reach = physComponent.alignToSlope ? 10 : 3;
            const sensor = {
                x: minX + inset,
                y: bottomY,
                w: Math.max(1, w - (inset * 2)),
                h: reach,
                rotation: 0,
                pivotX: 0,
                pivotY: 0
            };

            const footCenterX = (minX + maxX) / 2;
            const sensorLeft = minX + inset;
            const sensorRight = maxX - inset;
            const candidates = [];

            for (let i = 0; i < entities.length; i++) {
                const other = entities[i];
                if (other === entity || other.active === false) continue;
                if (other.layerId && inactiveLayers.has(other.layerId)) continue;

                const col = other.components.Collider;
                const shape = other.components.ShapeRenderer;
                const hasCollider = col && col.data && col.data.some(c => c.enabled);
                const hasShape = shape && (shape.enablePolygonCollision || shape.enableSegmentCollision || shape.enableCircleCollision);

                if (other.components.Tilemap && other.components.Tilemap.isSolid) {
                    const hitBounds = colliderSys._getTilemapHitBounds(sensor, other);
                    if (hitBounds) {
                        const tmLeft = hitBounds.x;
                        const tmRight = hitBounds.x + hitBounds.w;
                        const distToCenter = (footCenterX >= tmLeft && footCenterX <= tmRight)
                            ? 0
                            : Math.min(Math.abs(footCenterX - tmLeft), Math.abs(footCenterX - tmRight));
                        const overlapWidth = Math.max(0, Math.min(sensorRight, tmRight) - Math.max(sensorLeft, tmLeft));

                        candidates.push({
                            angle: 0,
                            normal: { x: 0, y: -1 },
                            distToCenter,
                            overlapWidth
                        });
                    }
                } else if (hasCollider || hasShape) {
                    const otherBounds = colliderSys.getBounds(other).filter(b => b.type === 'solid');
                    for (let bB of otherBounds) {
                        const intersectRes = colliderSys._obbIntersect(sensor, bB);
                        if (intersectRes) {
                            let candAngle = 0;
                            let candNormal = { x: 0, y: -1 };
                            let bMinX = -Infinity;
                            let bMaxX = Infinity;

                            if (bB.vertices && bB.vertices.length === 2) {
                                let p1 = bB.vertices[0];
                                let p2 = bB.vertices[1];
                                if (p1.x > p2.x) {
                                    const tmp = p1; p1 = p2; p2 = tmp;
                                }
                                const dx = p2.x - p1.x;
                                const dy = p2.y - p1.y;
                                candAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                                const len = Math.hypot(dx, dy) || 1;
                                let nx = -dy / len;
                                let ny = dx / len;
                                if (ny > 0) { nx = -nx; ny = -ny; }
                                candNormal = { x: nx, y: ny };
                                bMinX = p1.x;
                                bMaxX = p2.x;
                            } else if (typeof bB.rotation === 'number' && Math.abs(bB.rotation) > 0.0001) {
                                candAngle = bB.rotation * (180 / Math.PI);
                                candNormal = { x: Math.sin(bB.rotation), y: -Math.cos(bB.rotation) };
                                const bCorners = colliderSys._getObbCorners(bB);
                                bMinX = Math.min(...bCorners.map(c => c.x));
                                bMaxX = Math.max(...bCorners.map(c => c.x));
                            } else if (intersectRes.axis) {
                                let ax = intersectRes.axis.x;
                                let ay = intersectRes.axis.y;
                                if (ay > 0) { ax = -ax; ay = -ay; }
                                candNormal = { x: ax, y: ay };
                                candAngle = Math.atan2(ax, -ay) * (180 / Math.PI);
                                const bCorners = colliderSys._getObbCorners(bB);
                                bMinX = Math.min(...bCorners.map(c => c.x));
                                bMaxX = Math.max(...bCorners.map(c => c.x));
                            }

                            // Only consider upward floor surfaces (candNormal.y < -0.25, up to ~75 deg)
                            if (candNormal.y < -0.25) {
                                const distToCenter = (footCenterX >= bMinX && footCenterX <= bMaxX)
                                    ? 0
                                    : Math.min(Math.abs(footCenterX - bMinX), Math.abs(footCenterX - bMaxX));
                                const overlapWidth = Math.max(0, Math.min(sensorRight, bMaxX) - Math.max(sensorLeft, bMinX));

                                candidates.push({
                                    angle: candAngle,
                                    normal: candNormal,
                                    distToCenter,
                                    overlapWidth
                                });
                            }
                        }
                    }
                }
            }

            if (candidates.length > 0) {
                isGrounded = true;

                // Sort candidates to find dominant ground support:
                // 1. Spanning foot center (distToCenter === 0)
                // 2. Closest distance to foot center
                // 3. Largest overlap width
                // 4. Hysteresis: tie-breaker prefers current ground angle to avoid rapid alternating
                candidates.sort((a, b) => {
                    const spanA = a.distToCenter === 0 ? 1 : 0;
                    const spanB = b.distToCenter === 0 ? 1 : 0;
                    if (spanA !== spanB) return spanB - spanA;

                    if (Math.abs(a.distToCenter - b.distToCenter) > 0.5) {
                        return a.distToCenter - b.distToCenter;
                    }

                    if (Math.abs(a.overlapWidth - b.overlapWidth) > 1) {
                        return b.overlapWidth - a.overlapWidth;
                    }

                    const prevAngle = physComponent.groundAngle || 0;
                    const diffA = Math.abs(a.angle - prevAngle);
                    const diffB = Math.abs(b.angle - prevAngle);
                    return diffA - diffB;
                });

                const dominant = candidates[0];
                groundAngle = dominant.angle;
                groundNormal = dominant.normal;

                // Downhill snap assistance (Godot apply_floor_snap pattern):
                const isMovingDownhill = (groundAngle * physComponent.velocityX) > 0;
                if (physComponent._wasGrounded && physComponent.alignToSlope && isMovingDownhill && Math.abs(physComponent.velocityX) > 10) {
                    if (!colliderSys.checkSolid(entity)) {
                        colliderSys.moveAndSlide(entity, 0, reach);
                    }
                }
                break;
            }
        }

        if (!isGrounded) {
            physComponent._lastSlideNormal = null;
            physComponent.groundAngle = 0;
            physComponent.groundNormal = { x: 0, y: -1 };
        } else {
            physComponent.groundAngle = groundAngle;
            physComponent.groundNormal = groundNormal;
        }

        physComponent.isGrounded = isGrounded;
    }

    _updateSlopeAlignment(entity, phys, dt) {
        const transform = entity.components.Transform;
        if (!transform) return;

        let targetAngle = 0;
        const maxAngle = typeof phys.maxSlopeAngle === 'number' && phys.maxSlopeAngle > 0 ? phys.maxSlopeAngle : 60;

        if (phys.isGrounded) {
            const angle = Number(phys.groundAngle) || 0;
            if (Math.abs(angle) <= maxAngle) {
                targetAngle = angle;
            }
        }

        // Deadzone: if target angle is near 0, snap to 0
        if (Math.abs(targetAngle) < 0.5) {
            targetAngle = 0;
        }

        const speed = typeof phys.slopeAdaptSpeed === 'number' && phys.slopeAdaptSpeed > 0 
            ? phys.slopeAdaptSpeed 
            : 12;

        const currentRot = transform.rotation || 0;
        
        // Deadzone: if already very close to target, snap directly to avoid micro-jitter
        let diff = (targetAngle - currentRot) % 360;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;

        if (Math.abs(diff) < 0.2) {
            transform.rotation = targetAngle;
        } else {
            transform.rotation = this._lerpAngle(currentRot, targetAngle, speed * dt);
        }

        if (phys.keepColliderUpright && entity.components.Collider?.data) {
            for (let i = 0; i < entity.components.Collider.data.length; i++) {
                const col = entity.components.Collider.data[i];
                col.lockWorldRotation = true;
            }
        }
    }

    _lerpAngle(current, target, factor) {
        factor = Math.max(0, Math.min(1, factor));
        let diff = (target - current) % 360;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;
        return current + diff * factor;
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