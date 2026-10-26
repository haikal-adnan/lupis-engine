import { bus } from "./EventBus.js";

const BROADCAST_CHANNEL_NAME = "lupis_engine_preview_channel";

export default class ConsoleBroadcaster {
  constructor(channelName = BROADCAST_CHANNEL_NAME) {
    this.channelName = channelName || BROADCAST_CHANNEL_NAME;
    this.channel = new BroadcastChannel(this.channelName);
    this.isDestroyed = false;
    this.initListeners();
  }

  initListeners() {
    this._forwardLog = (entry) => {
      if (this.isDestroyed || !this.channel) return;
      try {
        this.channel.postMessage({
          type: "ENGINE_CONSOLE_LOG",
          payload: entry
        });
      } catch (err) {
        // Channel may be closed or in invalid state; ignore gracefully
      }
    };

    this._forwardClear = () => {
      if (this.isDestroyed || !this.channel) return;
      try {
        this.channel.postMessage({ type: "ENGINE_CONSOLE_CLEAR" });
      } catch (err) {
        // Channel may be closed; ignore gracefully
      }
    };

    bus.on('console:log', this._forwardLog);
    bus.on('console:warn', this._forwardLog);
    bus.on('console:error', this._forwardLog);
    bus.on('console:clear', this._forwardClear);

    this.channel.onmessage = (event) => {
      if (event.data.type === "CONSOLE_CLEAR_REQUEST") {
      }
    };
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this._forwardLog) {
      bus.off('console:log', this._forwardLog);
      bus.off('console:warn', this._forwardLog);
      bus.off('console:error', this._forwardLog);
      this._forwardLog = null;
    }

    if (this._forwardClear) {
      bus.off('console:clear', this._forwardClear);
      this._forwardClear = null;
    }

    try {
      this.channel?.close();
    } catch (err) {}
    this.channel = null;
  }
}