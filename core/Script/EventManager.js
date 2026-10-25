// Central publish-subscribe signal bus for engine systems and gameplay events
export default class EventManager {
    constructor() {
        this.listeners = new Map();
        this.globalDefinitions = null;
    }

    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(callback);
    }

    once(eventName, callback) {
        const wrapper = (...args) => {
            this.off(eventName, wrapper);
            callback(...args);
        };
        this.on(eventName, wrapper);
    }

    off(eventName, callback) {
        if (!this.listeners.has(eventName)) return;
        
        const callbacks = this.listeners.get(eventName);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    // Dispatches an event to subscribed listeners with error boundaries
    emit(eventName, ...args) {
        if (!this.listeners.has(eventName)) return;

        const callbacks = [...this.listeners.get(eventName)];
        callbacks.forEach(callback => {
            try {
                callback(...args);
            } catch (err) {
                console.error(`[EventManager] Error executing '${eventName}':`, err);
            }
        });
    }

    registerGlobalDefinitions(eventsArray) {
        this.globalDefinitions = eventsArray; 
    }
    
    clearAll() {
        this.listeners.clear();
    }
}
