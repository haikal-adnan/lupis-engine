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

            // Filter entitas yang valid untuk diproses fisika
            if (entity.active === false) continue;
            if (entity.layerId && inactiveLayers.has(entity.layerId)) continue;
            if (!entity.components.Physics || !entity.components.Physics.enabled) continue;
            if (!entity.components.Transform) continue;

            const phys = entity.components.Physics;

            // Reset info kolisi setiap frame
            phys.collisionInfo = { hitSolid: null, hitSolidX: null, hitSolidY: null, hitTrigger: null };

            // 1. Terapkan Gravitasi (Y Positif = Jatuh)
            if (phys.gravityScale !== 0) {
                phys.velocityY += GLOBAL_GRAVITY * phys.gravityScale * dt;
            }

            // 2. Terapkan Drag/Gesekan (Hanya pada sumbu X jika ada gravitasi)
            if (phys.drag > 0) {
                const effectiveDrag = GLOBAL_DRAG * phys.drag;
                const damping = Math.max(0, 1 - (effectiveDrag * dt));
                
                phys.velocityX *= damping;

                // Jika objek tidak punya gravitasi (misal: peluru), drag berlaku di kedua sumbu
                if (phys.gravityScale === 0) {
                    phys.velocityY *= damping;
                }
            }

            

            // 3. Clamp Kecepatan agar tidak menembus dinding (Tunneling)
            phys.velocityX = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, phys.velocityX));
            phys.velocityY = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, phys.velocityY));

            // 4. Kalkulasi Pergerakan & Resolusi Kolisi
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

            if (Math.abs(dx) > 0) { 
                phys.facingDirection = dx > 0 ? "right" : "left";
            }

            // 5. Cek apakah menyentuh lantai (Grounded) & Triggers
            this._checkGrounded(entity, phys, inactiveLayers);
            this._checkTriggers(entity, phys);

            // 6. Resolusi Velocity setelah Grounded
            // Jika di tanah dan sedang bergerak turun, hentikan velocity Y
            if (phys.isGrounded && phys.velocityY > 0) {
                phys.velocityY = 0;
            }
            // Jika menabrak atap saat melompat, hentikan velocity Y
            if (phys.velocityY < 0 && phys.collisionInfo.hitSolidY) {
                phys.velocityY = 0;
            }

            // 7. Penentuan Movement State (Untuk Animasi)
            this._updateMovementState(phys);
        }
    }

    _updateMovementState(phys) {
        if (phys.isGrounded) {
            // Di tanah: Tentukan antara Idle atau Running
            if (Math.abs(phys.velocityX) > 5) { // Threshold 5 agar tidak flicker saat berhenti
                phys.movementState = "running";
            } else {
                phys.movementState = "idle";
            }
        } else {
            // Di udara (On Air): Tentukan antara Jumping atau Falling
            if (phys.velocityY < 0) {
                phys.movementState = "jumping";
            } else {
                phys.movementState = "falling";
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

        // Sensor sedikit lebih sempit dari badan (inset) dan menjorok 1-2 pixel ke bawah (reach)
        const inset = 2; 
        const reach = 2; 
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
            if (other === entity || other.active === false) continue;
            if (other.layerId && inactiveLayers.has(other.layerId)) continue;

            // Cek tabrakan dengan Tilemap
            if (other.components.Tilemap && other.components.Tilemap.isSolid) {
                const hitBounds = colliderSys._getTilemapHitBounds(sensor, other);
                if (hitBounds) {
                    isGrounded = true;
                    break;
                }
            } 
            // Cek tabrakan dengan Collider Solid biasa
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

