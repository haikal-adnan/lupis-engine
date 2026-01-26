export default class VariableManager {
    constructor() {
        // Map<ID, Value>
        this.globals = new Map();
        
        // Map<ScriptID, SchemaObject>
        this.scriptSchemas = new Map();
    }

    initGlobals(globalVarsArray) {
        this.globals.clear();
        if (Array.isArray(globalVarsArray)) {
            globalVarsArray.forEach(v => {
                // PENTING: Gunakan _id sebagai key agar GraphRunner bisa menemukannya
                this.globals.set(v._id, v.defaultValue);
            });
            console.log(`[VariableManager] Loaded ${this.globals.size} Global Variables.`);
        }
    }

    // --- Runtime Access Methods ---

    getGlobal(id) {
        return this.globals.get(id);
    }

    setGlobal(id, value) {
        if (this.globals.has(id)) {
            this.globals.set(id, value);
        } else {
            console.warn(`[VariableManager] Global variable ID '${id}' not found.`);
        }
    }

    hasGlobal(id) {
        return this.globals.has(id);
    }

    // --- Editor/Schema Support ---

    registerScriptSchema(scriptId, variablesArray) {
        if (!variablesArray) return;
        
        const schema = {};
        variablesArray.forEach(v => {
            schema[v.name] = {
                type: v.type,
                defaultValue: v.defaultValue,
                id: v._id
            };
        });
        
        this.scriptSchemas.set(scriptId, schema);
    }

    getScriptDefaults(scriptId) {
        const schema = this.scriptSchemas.get(scriptId);
        if (!schema) return {};

        const defaults = {};
        for (const [key, val] of Object.entries(schema)) {
            defaults[key] = val.defaultValue;
        }
        return defaults;
    }
}