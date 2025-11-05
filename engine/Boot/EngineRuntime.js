// // engine/Boot/EngineRuntime.js
// import { bus } from "../Core/EventBus.js";
// import { econsole } from "../Core/EngineConsole.js";
// import { startEngine, stopEngine, reloadEngine } from "../main.js";

// export const EngineRuntime = {
//   async boot({ project, glCanvas, uiCanvas }) {
//     try {
//       econsole.log(`🚀 Booting engine for project: ${project}`);
//       await startEngine(glCanvas, uiCanvas);
//       bus.emit("engine:started", { project });
//     } catch (err) {
//       econsole.error("❌ Engine boot failed:", err);
//     }
//   },

//   async reload() {
//     econsole.log("♻ Reloading engine...");
//     bus.emit("engine:reload:before");
//     await reloadEngine?.();
//     bus.emit("engine:reload:after");
//   },

//   async shutdown() {
//     econsole.log("🛑 Stopping engine...");
//     await stopEngine?.();
//     bus.emit("engine:stopped");
//   },
// };
