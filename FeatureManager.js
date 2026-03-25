
/** @typedef SetTimeoutFunction @type { typeof setTimeout } */
/** @typedef EventListenerFunction @type { (...args: any[]) => any } */
/** @typedef RegisteredFeatureData @type { { onEnable: Function, onDisable: Function, eventListeners: Array<EventListenerData> } }  */
/** @typedef EventListenerData @type { { connectable: Connectable, event: String, callback: (f:Function) => Function } } */
/** @typedef ConnectFunction @type { (event: string, callback: EventListenerFunction) => number } */
/** @typedef Connectable @type { { connect: ConnectFunction, connectAfter: ConnectFunction, disconnect: (id: number) => undefined } } */
/** @typedef ActiveEventListener @type { { id: number, connectable: Connectable } } */

class ManagedFeature {

    #onEnable;
    #onDisable;
    #eventListeners;
    #activeEventListeners;
    #activeTimeouts;

    /**
     * @param {Function} onEnable
     * @param {Function} onDisable
     * @param {EventListenerData[]} eventListeners
     * @param {ActiveEventListener[]} activeEventListeners
     * @param {number[]} activeTimeouts
     */
    constructor(onEnable, onDisable, eventListeners, activeEventListeners, activeTimeouts) {
        this.#onEnable = onEnable;
        this.#onDisable = onDisable;
        this.#eventListeners = eventListeners;
        this.#activeEventListeners = activeEventListeners;
        this.#activeTimeouts = activeTimeouts;
    }

    enable() {
        this.#onEnable();
        this.#connect();
    }

    disable() {
        this.#onDisable();
        this.#disconnect();
        this.#clearTimeouts();
    }

    #disconnect() {
        const disconnectAnswer = this.#activeEventListeners.map(elData => elData.connectable.disconnect(elData.id));
        this.#activeEventListeners.length = 0;
        return disconnectAnswer;
    }

    #connect() {
        this.#disconnect();
        const activeELs = this.#eventListeners.map(({ connectable, event, callback }) => {
            const id = connectable.connect(event, (...args) => callback(this.SET_TIEOUT)(...args));
            return { id, connectable };
        });
        this.#activeEventListeners.push(...activeELs);
    }

    #clearTimeouts() {
        this.#activeTimeouts.map(number => clearTimeout(number))
    }

    SET_TIEOUT(callback, time, ...args) {
        const id = setTimeout(callback, time, ...args)
        this.#activeTimeouts.push(id);
    }
}

const noOp = () => undefined;

export default class FeatureManager {
    /** @type { Map < ManagedFeature, { eventListeners: ActiveEventListener[]; timeouts: number[] } > } */
    #features = new Map();

    /**
     * @param {Function} onEnable
     * @param {Function} onDisable
     * @param {Array<EventListenerData>} eventListeners
     */
    new(onEnable = noOp, onDisable = noOp, eventListeners = []) {
        const activeEventListenerState = [];
        const activeTimeoutsState = [];
        const newFeature = new ManagedFeature(onEnable, onDisable, eventListeners, activeEventListenerState, activeTimeoutsState);
        this.#features.set(newFeature, { eventListeners: activeEventListenerState, timeouts: activeTimeoutsState });
        return newFeature;
    }

    disableAll() {
        return this.#features.forEach((registeredFeature, featureHandle) => featureHandle.disable());
    }
}
