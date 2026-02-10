export default class PhysicsSystem {
    constructor(game) {
        this.game = game;
        this.GRAVITY = 1200;
        this.MAX_VELOCITY = 2000;
        this.MIN_MOVE_DISTANCE = 0.001;
    }

    update(dt) {
        const entities = this.game.world.entities;

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];

            if (!entity.active && !entity.isActive) continue;
            if (!entity.components.Physics || !entity.components.Physics.enabled) continue;
            if (!entity.components.Transform) continue;

            const phys = entity.components.Physics;

            // Reset info
            phys.collisionInfo = { hitSolid: null, hitTrigger: null, isGrounded: false };

            // 1. APPLY GRAVITY
            if (phys.gravityScale !== 0) {
                phys.velocityY += this.GRAVITY * phys.gravityScale * dt;
            }

            // 2. APPLY DRAG (FIX BUG DRAG TINGGI)
            if (phys.drag > 0) {
                // Menggunakan Math.max(0, ...) mencegah velocity berbalik arah jika drag terlalu besar
                phys.velocityX *= Math.max(0, 1 - (phys.drag * dt));
                
                // Opsional: Apply drag ke Y juga jika ingin "gesekan udara" saat jatuh
                // phys.velocityY *= Math.max(0, 1 - (phys.drag * dt));
            }

            // Clamp Terminal Velocity
            phys.velocityX = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, phys.velocityX));
            phys.velocityY = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, phys.velocityY));

            const dx = phys.velocityX * dt;
            const dy = phys.velocityY * dt;

            // 3. MOVE AND SLIDE
            if (Math.abs(dx) > this.MIN_MOVE_DISTANCE || Math.abs(dy) > this.MIN_MOVE_DISTANCE) {
                const hitObject = this.game.colliderSystem.moveAndSlide(entity, dx, dy);
                if (hitObject) {
                    phys.collisionInfo.hitSolid = hitObject;
                }
            }

            // 4. CHECK GROUND & TRIGGER (Setelah posisi update)
            this._checkGrounded(entity, phys);
            this._checkTriggers(entity, phys);

            // Stop velocity jika menapak tanah
            if (phys.isGrounded && phys.velocityY > 0) {
                phys.velocityY = 0;
            }

            // Stop velocity jika kepala mentok atap
            if (phys.velocityY < 0 && phys.collisionInfo.hitSolid) {
                const t = entity.components.Transform;
                const hitT = phys.collisionInfo.hitSolid.components.Transform;
                // Logika sederhana: jika collision di atas center y kita
                if (hitT && hitT.y < t.y) {
                    phys.velocityY = 0;
                }
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

        // Sensor dibuat sedikit lebih toleran
        const sensor = {
            x: bounds.x + 2, // Margin kiri
            y: bounds.y + bounds.h, // Tepat di kaki
            w: bounds.w - 4, // Margin kanan
            h: 4 // Tebal sensor ke bawah
        };

        let isGrounded = false;
        const entities = this.game.world.entities;

        for (let i = 0; i < entities.length; i++) {
            const other = entities[i];
            if (other === entity) continue;
            if (!other.active && !other.isActive) continue;

            const col = other.components.Collider;
            // Pastikan mengecek lantai yang SOLID
            if (!col || !col.enabled || col.type !== 'solid') continue;

            const otherBounds = colliderSys.getBounds(other);
            if (otherBounds && this._aabbIntersect(sensor, otherBounds)) {
                isGrounded = true;
                break;
            }
        }

        physComponent.isGrounded = isGrounded;
    }

    // ... sisa method sama ...
    _checkTriggers(entity, physComponent) {
       const overlaps = this.game.colliderSystem._findAllCollisions(entity);
       if (overlaps && overlaps.length > 0) {
           const triggerHit = overlaps.find(e => e.tag !== 'ground');
           if (triggerHit) physComponent.collisionInfo.hitTrigger = triggerHit;
       }
    }

    _aabbIntersect(a, b) {
        return (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
    }
}