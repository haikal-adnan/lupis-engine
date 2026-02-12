export default class Entity {
    constructor(id) {
        this.id = id;
        this.scriptId = null;
        
        this.active = true; 
        this.visible = true;

        this.name = "New Entity";
        this.type = "entity";    
        this.tag = "untagged";   
        this.layerId = "layer_root"; 
        this.prefabId = null;

        // NEW: Sorting Properties
        this.zIndex = 0;
        this.orderIndex = 0;

        this.parentId = null; 
        this.children = []; 

        this.components = {};

        this.isDirty = false;
        
        // Editor metadata
        this._editor = {}; 
    }

    addComponent(name, data) {
        this.components[name] = data;
        // Flag dirty jika transform berubah agar renderer update matriks
        if (name === 'Transform' || name === 'UITransform') this.isDirty = true;
    }

    getComponent(name) {
        return this.components[name];
    }
    
    addChild(entity) {
        // Prevent circular or duplicate adding
        if (this.children.some(c => c.id === entity.id)) return;
        if (entity.id === this.id) return;

        entity.parentId = this.id;
        this.children.push(entity);
        
        // Note: Sorting children usually happens in the Renderer or SceneLoader
        // based on zIndex/orderIndex, not immediately upon push here.
    }

    removeChild(childId) {
        const index = this.children.findIndex(c => c.id === childId);
        
        if (index !== -1) {
            this.children.splice(index, 1);
        }
    }
}