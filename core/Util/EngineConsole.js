import { bus } from "./EventBus.js";

class EngineConsole {
  constructor() {
    this.logs = [];
  }

  log(message, context = null) {
    this.#add("log", message, context);
  }

  warn(message, context = null) {
    this.#add("warn", message, context);
  }

  error(message, context = null) {
    this.#add("error", message, context);
  }

  clear() {
    this.logs = [];
    bus.emit("console:clear");
  }

  #add(type, message, context = null) {
    const source = this.#getCallerFile();
    let finalMessage = typeof message === 'object' && message !== null ? JSON.stringify(message) : String(message ?? '');

    let ctx = null;
    if (context && typeof context === 'object') {
      const scene = context.scene || 'Scene';
      const entity = context.entityScriptId || context.entity || 'Entity';
      const script = context.script || 'Script';
      const node = context.node || 'Node';
      ctx = { scene, entityScriptId: entity, script, node };

      const prefix = `[${scene}] [${entity}] [${script}] [${node}]`;
      if (!finalMessage.startsWith(prefix)) {
        finalMessage = `${prefix} ${finalMessage}`;
      }
    }

    const entry = { type, message: finalMessage, source, ...(ctx ? { context: ctx } : {}), time: Date.now() };
    this.logs.push(entry);
    bus.emit(`console:${type}`, entry);
  }

  #getCallerFile() {
    try {
      const err = new Error();
      const stack = err.stack?.split("\n") || [];

      const caller = stack.find(
        line =>
          line.includes(".js") &&
          !line.includes("EngineConsole.js") &&
          !line.includes("EventBus.js")
      );

      if (!caller) return "(unknown)";

      const regex =
        /([A-Za-z0-9_\-/]+\.js)(?::(\d+))?(?::(\d+))?/;
      const match = caller.match(regex);

      if (match) {
        const file = match[1].split("/").pop();
        const line = match[2] ? `:${match[2]}` : "";
        return `${file}${line}`;
      }

      return "(unknown)";
    } catch (err) {
      return "(unknown)";
    }
  }
}

export const econsole = new EngineConsole();
export default EngineConsole;
