export default class VariableManager {
    constructor() {
        this.globals = new Map();
        this.nameToIdMap = new Map();
        this.scriptSchemas = new Map();
    }

    initGlobals(globalVarsArray) {
        this.globals.clear();
        this.nameToIdMap.clear();

        if (Array.isArray(globalVarsArray)) {
            globalVarsArray.forEach(v => {
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

    getGlobal(varName) {
        const id = this.nameToIdMap.get(varName);
        if (!id) {
            console.warn(`[VariableManager] Global variable '${varName}' tidak terdaftar pada schema Global.`);
            return null;
        }

        return this.globals.get(id) ?? null;
    }

    setGlobal(varName, value) {
        const id = this.nameToIdMap.get(varName);
        if (!id) {
            console.error(`[Runtime Error] Global variable '${varName}' tidak terdaftar pada Global Schema!`);
            return;
        }

        this.globals.set(id, value);
    }

    hasGlobal(varName) {
        return this.nameToIdMap.has(varName);
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