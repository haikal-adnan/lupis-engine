export default class Entity {
    constructor(id) {
        this.id = id;
        
        this.active = true; 
        this.visible = true;

        this.name = "New Entity";
        this.type = "entity";    
        this.tag = "untagged";   
        this.layerId = "layer_root"; 
        this.prefabId = null;

        this.parentId = null; 
        this.children = []; 

        // Container Component (Transform ada di dalam sini)
        this.components = {};

        this.isDirty = false;
    }

    addComponent(name, data) {
        this.components[name] = data;
        if (name === 'Transform') this.isDirty = true;
    }

    getComponent(name) {
        return this.components[name];
    }
    
    // Helper untuk manajemen child (Runtime)
    addChild(entity) {
        // Mencegah duplikasi
        if (this.children.some(c => c.id === entity.id)) return;
        if (entity.id === this.id) return;

        entity.parentId = this.id;
        this.children.push(entity);
    }

    // --- TAMBAHKAN FUNGSI INI ---
    removeChild(childId) {
        // Cari index child berdasarkan ID
        const index = this.children.findIndex(c => c.id === childId);
        
        if (index !== -1) {
            // Set parentId child menjadi null (opsional, tergantung logic engine)
            // this.children[index].parentId = null; 
            
            // Hapus dari array children
            this.children.splice(index, 1);
        }
    }
}