// engine/Util/EventBus.js
class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(event, handler) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(handler);
  }

  off(event, handler) {
    if (!this.events.has(event)) return;
    const list = this.events.get(event);
    const idx = list.indexOf(handler);
    if (idx >= 0) list.splice(idx, 1);
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return;
    for (const handler of this.events.get(event)) {
      try { handler(...args); }
      catch (err) { console.warn(`[EventBus] Error in "${event}" handler:`, err); }
    }
  }

  once(event, handler) {
    const wrapper = (...args) => {
      handler(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

export const bus = new EventBus();
export default EventBus;
