import { bus } from "./EventBus.js";

const BROADCAST_CHANNEL_NAME = "lupis_engine_preview_channel";

export default class ConsoleBroadcaster {
  constructor() {
    this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    this.initListeners();
  }

  initListeners() {
    const forwardLog = (entry) => {
      this.channel.postMessage({
        type: "ENGINE_CONSOLE_LOG",
        payload: entry
      });
    };

    bus.on('console:log', forwardLog);
    bus.on('console:warn', forwardLog);
    bus.on('console:error', forwardLog);
    
    bus.on('console:clear', () => {
      this.channel.postMessage({ type: "ENGINE_CONSOLE_CLEAR" });
    });

    this.channel.onmessage = (event) => {
      if (event.data.type === "CONSOLE_CLEAR_REQUEST") {
      }
    };
  }

  destroy() {
    this.channel.close();
  }
}