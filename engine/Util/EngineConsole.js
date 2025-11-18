import { bus } from "./EventBus.js";

class EngineConsole {
  constructor() {
    this.logs = [];
  }

  log(message) {
    this.#add("log", message);
  }

  warn(message) {
    this.#add("warn", message);
  }

  error(message) {
    this.#add("error", message);
  }

  clear() {
    this.logs = [];
    bus.emit("console:clear");
  }

  #add(type, message) {
    const source = this.#getCallerFile();
    const entry = { type, message, source, time: Date.now() };
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
        // Hasil misalnya: ["main.js", "22", "10"]
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
