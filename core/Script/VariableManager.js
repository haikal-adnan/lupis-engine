export default class VariableManager {
    constructor() {
        this.globals = new Map();
        this.nameToIdMap = new Map();
        this.scriptSchemas = new Map();
        this._initialGlobalsBackup = [];
    }

    initGlobals(globalVarsArray) {
        this._initialGlobalsBackup = Array.isArray(globalVarsArray)
            ? JSON.parse(JSON.stringify(globalVarsArray))
            : [];
        this.resetGlobals();
    }

    resetGlobals() {
        this.globals.clear();
        this.nameToIdMap.clear();

        if (Array.isArray(this._initialGlobalsBackup)) {
            this._initialGlobalsBackup.forEach(v => {
                if (!v.name || !v.id) return;

                let val = v.defaultValue;
                if (val !== null && typeof val === 'object') {
                    val = JSON.parse(JSON.stringify(val));
                }

                this.nameToIdMap.set(v.name, v.id);
                this.globals.set(v.id, val);
            });
        }
    }

    getGlobal(varNameOrId) {
        if (!varNameOrId) return null;
        const id = this.globals.has(varNameOrId) ? varNameOrId : this.nameToIdMap.get(varNameOrId);
        if (!id) {
            console.warn(`[VariableManager] Global variable '${varNameOrId}' tidak terdaftar pada schema Global.`);
            return null;
        }

        return this.globals.get(id) ?? null;
    }

    setGlobal(varNameOrId, value) {
        if (!varNameOrId) return;
        const id = this.globals.has(varNameOrId) ? varNameOrId : this.nameToIdMap.get(varNameOrId);
        if (!id) {
            console.error(`[Runtime Error] Global variable '${varNameOrId}' tidak terdaftar pada Global Schema!`);
            return;
        }

        this.globals.set(id, value);
    }

    hasGlobal(varNameOrId) {
        if (!varNameOrId) return false;
        return this.globals.has(varNameOrId) || this.nameToIdMap.has(varNameOrId);
    }

    registerScriptSchema(scriptId, variablesArray) {
        if (!variablesArray) return;
        
        const schema = new Map();
        variablesArray.forEach(v => {
            if (v.name && v.id) {
                schema.set(v.name, {
                    id: v.id,
                    type: v.type,
                    defaultValue: v.defaultValue
                });
            }
        });
        
        this.scriptSchemas.set(scriptId, schema);
    }

    getScriptSchema(scriptId) {
        return this.scriptSchemas.get(scriptId);
    }
}