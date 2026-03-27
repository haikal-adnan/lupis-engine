
export const NodeLayer = {
    'get_layer': {
        getOutput: (runner, node, outputKey) => {
            const targetId = runner.getInputValue(node, 'target_in');
            const layer = runner.resolveLayer(targetId);
            
            if (!layer) {
                console.warn(`[Node: get_layer] ⚠️ Layer tidak ditemukan! Target ID:`, targetId);
                return null;
            }

            switch(outputKey) {
                case 'layerId': return layer.scriptId || layer._id || layer.id || 'Unknown_ID';
                case 'name': return layer.name || 'Unknown';
                case 'visible': return layer.visible;  
                case 'active' : return layer.active; // <-- Diperbaiki (sebelumnya typo entity.active)
                case 'locked': return layer.locked;
                case 'zIndex': return layer.zIndex;
                case 'opacity': return Math.round((layer.opacity ?? 1.0) * 100); // <-- Format persen untuk user
                default: return null;
            }
        }
    },

    'set_layer': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target_in');
            const layer = runner.resolveLayer(targetId);
            
            if (!layer) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const newName = runner.getInputValue(node, 'name');
            const newVisible = runner.getInputValue(node, 'visible');
            const newLocked = runner.getInputValue(node, 'locked');
            const newZIndex = runner.getInputValue(node, 'zIndex');
            const newActive = runner.getInputValue(node, 'active');
            const newOpacity = runner.getInputValue(node, 'opacity'); // <-- Ambil input opacity

            if (newName !== undefined && newName !== null) {
                layer.name = String(newName);
            }

            if (newVisible !== undefined && newVisible !== null) {
                layer.visible = Boolean(newVisible);
            }

            if (newLocked !== undefined && newLocked !== null) {
                layer.locked = Boolean(newLocked);
            }

            if (newActive !== undefined && newActive !== null) {
                layer.active = Boolean(newActive);
            }

            if (newZIndex !== undefined && newZIndex !== null) {
                layer.zIndex = Number(newZIndex);
            }

            if (newOpacity !== undefined && newOpacity !== null) {
                // Konversi format persen dari user (0-100) menjadi desimal engine (0.0-1.0)
                // Menggunakan Math.max dan min agar nilainya tidak bisa diset < 0% atau > 100%
                layer.opacity = Math.max(0, Math.min(100, Number(newOpacity))) / 100;
            }

            runner.executeFlow(node._id, 'exec_out');
        }
    }
};