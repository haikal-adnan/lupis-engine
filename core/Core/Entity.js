export default class Entity {
    constructor(id) {
        this.id = id;
        this.scriptId = null;
        
        this.active = true; 
        this.visible = true;
        this.locked = false;

        this.type = "entity";    
        this.tags = [];   
        this.layerId = "layer_root"; 
        this.prefabId = null;

        this.zIndex = 0;
        this.orderIndex = 0;

        this.parentId = null; 
        this.children = []; 

        this.components = {};

        this.isDirty = false;
        
        this._editor = {}; 
    }

    get tag() {
        return (this.tags && this.tags.length > 0) ? this.tags[0] : "untagged";
    }

    set tag(val) {
        if (!val || (typeof val === 'string' && val.toLowerCase() === "untagged")) {
            this.tags = [];
        } else if (Array.isArray(val)) {
            const list = [];
            for (const item of val) {
                const clean = String(item || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
                if (clean && !list.some(t => t.toLowerCase() === clean.toLowerCase())) {
                    list.push(clean);
                }
            }
            this.tags = list;
        } else {
            const clean = String(val).trim();
            if (clean) {
                this.tags = [clean];
            }
        }
    }

    hasTag(tag) {
        if (!tag || !Array.isArray(this.tags)) return false;
        const target = String(tag).trim().toLowerCase();
        return this.tags.some(t => String(t).trim().toLowerCase() === target);
    }

    hasAnyTag(tagList = []) {
        if (!Array.isArray(tagList)) return false;
        return tagList.some(t => this.hasTag(t));
    }

    hasAllTags(tagList = []) {
        if (!Array.isArray(tagList) || tagList.length === 0) return false;
        return tagList.every(t => this.hasTag(t));
    }

    addTag(tag) {
        const clean = String(tag || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        if (!clean) return false;
        if (!Array.isArray(this.tags)) this.tags = [];
        if (!this.hasTag(clean)) {
            this.tags.push(clean);
            return true;
        }
        return false;
    }

    removeTag(tag) {
        if (!tag || !Array.isArray(this.tags)) return false;
        const target = String(tag).trim().toLowerCase();
        const initialLen = this.tags.length;
        this.tags = this.tags.filter(t => String(t).trim().toLowerCase() !== target);
        return this.tags.length !== initialLen;
    }

    addComponent(name, data) {
        this.components[name] = data;
        if (name === 'Transform' || name === 'UITransform') this.isDirty = true;
    }

    getComponent(name) {
        return this.components[name];
    }
    
    addChild(entity) {
        if (this.children.some(c => c.id === entity.id)) return;
        if (entity.id === this.id) return;

        entity.parentId = this.id;
        this.children.push(entity);
    }

    removeChild(childId) {
        const index = this.children.findIndex(c => c.id === childId);
        
        if (index !== -1) {
            this.children.splice(index, 1);
        }
    }
}
