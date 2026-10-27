export default class EventManager {
    constructor() {
        this.listeners = new Map();
    }

    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(callback);
    }

    off(eventName, callback) {
        if (!this.listeners.has(eventName)) return;
        
        const callbacks = this.listeners.get(eventName);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(eventName, ...args) {
        if (!this.listeners.has(eventName)) return;

        const callbacks = this.listeners.get(eventName);
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