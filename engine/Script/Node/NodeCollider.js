export const NodeCollider = {
    // ------------------------------------------------------------------
    // Logic: SOLID COLLISION
    // ------------------------------------------------------------------
    'solid_collision': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const filterTag = runner.getInputValue(node, 'filter_tag');
            const entity = runner.resolveEntity(targetId);

            if (!entity) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            // [FIX] Validasi Tipe Collider
            // Node ini HANYA boleh jalan jika Collidernya tipe SOLID
            const collider = entity.components.Collider;
            if (!collider || !collider.enabled || collider.type !== 'solid') {
                // Jika bukan solid, skip logic tabrakan fisik, langsung lewat
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            let hitObject = runner.game.colliderSystem.checkSolid(entity);

            // LOGIKA FILTER TAG
            if (hitObject && filterTag && filterTag.trim() !== "") {
                const objTag = hitObject.tag || hitObject.components?.Tags?.value;
                if (objTag !== filterTag) {
                    hitObject = null; 
                }
            }

            const isColliding = !!hitObject;

            node._tempData = {
                hit_id: hitObject ? (hitObject.id || hitObject._id) : null,
                is_colliding: isColliding
            };

            runner.executeFlow(node._id, 'exec_out');

            if (hitObject) {
                runner.executeFlow(node._id, 'on_hit');
            }
        },
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'hit_id') return node._tempData?.hit_id || null;
            if (outputKey === 'is_colliding') return node._tempData?.is_colliding || false;
            return null;
        }
    },

    // ------------------------------------------------------------------
    // Logic: TRIGGER ZONE
    // ------------------------------------------------------------------
    // Logic: TRIGGER ZONE (FIXED)
    'trigger_zone': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target');
            const filterTag = runner.getInputValue(node, 'filter_tag');
            const entity = runner.resolveEntity(targetId);
            
            if (!entity) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            // [FIX 1] Siapkan penyimpanan state yang unik per Entity ID
            // Jika node object dipakai rame-rame (shared), kita butuh key ID entity.
            if (!node._triggerStates) {
                node._triggerStates = {}; 
            }
            const entityId = entity.id || entity._id;
            
            // Ambil state khusus untuk entity ini
            let myState = node._triggerStates[entityId];
            if (!myState) {
                myState = { isOverlapping: false, lastId: null };
                node._triggerStates[entityId] = myState;
            }

            // [FIX 2] Validasi Tipe Collider
            const collider = entity.components.Collider;
            if (!collider || !collider.enabled || collider.type !== 'trigger') {
                // Reset state hanya untuk entity ini
                myState.isOverlapping = false;
                myState.lastId = null;
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            // Cek Overlap Fisik
            let overlapObject = runner.game.colliderSystem.checkOverlap(entity, filterTag);
            const currentId = overlapObject ? (overlapObject.id || overlapObject._id) : null;
            const previousId = myState.lastId;
            
            // Data untuk output (Temporary data juga sebaiknya unik per eksekusi, 
            // tapi node._tempData biasanya langsung dibaca setelah execute, jadi aman)
            const isCurrentlyOverlapping = !!currentId;
            
            let newData = {
                other_id: currentId || previousId,
                is_inside: isCurrentlyOverlapping
            };
            node._tempData = newData; // Simpan untuk getOutput

            // --- STATE MACHINE ---

            // KONDISI 1: ENTER (Baru masuk frame ini)
            if (!previousId && currentId) {
                myState.lastId = currentId; // Update State
                runner.executeFlow(node._id, 'on_enter');
            }
            
            // KONDISI 2: SWITCH (Pindah dari object A ke object B tanpa keluar)
            else if (previousId && currentId && previousId !== currentId) {
                myState.lastId = currentId; // Update State
                runner.executeFlow(node._id, 'on_enter');
            }

            // KONDISI 3: EXIT (Dulu ada, sekarang null)
            else if (previousId && !currentId) {
                myState.lastId = null; // Update State
                
                // Khusus event exit, kita mau kirim ID yang barusan keluar
                node._tempData = {
                    other_id: previousId,
                    is_inside: false
                };
                runner.executeFlow(node._id, 'on_exit');
                
                // Kembalikan temp data ke status sekarang setelah event exit selesai
                node._tempData = newData;
            }
            
            // Update status overlap di state persistent
            myState.isOverlapping = isCurrentlyOverlapping;

            // Jalankan flow utama
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => {
            // Catatan: getOutput ini bergantung pada eksekusi terakhir.
            // Jika ada masalah concurrency, ini juga perlu mengambil data dari state map.
            if (outputKey === 'other_id') return node._tempData?.other_id || null;
            if (outputKey === 'is_inside') return node._tempData?.is_inside || false;
            return null;
        }
    }
};