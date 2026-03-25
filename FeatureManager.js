
/** @typedef EventListenerData @type { { connectable: Connectable, event: String, callback: Function } } */
/** @typedef ConnectFunction @type { (event: string, callback: Function) => number } */
/** @typedef Connectable @type { { connect: ConnectFunction, connectAfter: ConnectFunction, disconnect: (id: number) => undefined } } */
/** @typedef ActiveEventListener @type { { id: number, connectable: Connectable } } */
/** @typedef SetTimeoutFunction @type {typeof setTimeout} */
/** @typedef NewParams @type { { onEnable: Function, onDisable: Function, eventListeners: Array<EventListenerData> } } */
/** @typedef NewParamsBuilder @type { (setTimeout: SetTimeoutFunction) => NewParams } */

class OnGoing {
    /** @type {Array<ActiveEventListener>} */
    eventListeners = [];
    /** @type {Set<number>} */
    timeouts = new Set();
}

class ManagedFeature {

    #onEnable;
    #onDisable;
    #eventListeners;
    #onGoing;

    /**
     * @param {Function} onEnable
     * @param {Function} onDisable
     * @param {EventListenerData[]} eventListeners
     * @param {OnGoing} onGoings
     */
    
    constructor(onEnable, onDisable, eventListeners, onGoings) {
        this.#onEnable = onEnable;
        this.#onDisable = onDisable;
        this.#eventListeners = eventListeners;
        this.#onGoing = onGoings;
    }

    enable() {
        this.#onEnable();
        this.#connect();
    }

    disable() {
        this.#disconnect();
        this.#clearTimeouts();
        this.#onDisable();
    }

    #disconnect() {
        const disconnectAnswer = this.#onGoing.eventListeners.map(elData => elData.connectable.disconnect(elData.id));
        this.#onGoing.eventListeners.length = 0;
        return disconnectAnswer;
    }

    #connect() {
        this.#disconnect();
        const activeELs = this.#eventListeners.map(({ connectable, event, callback }) => {
            const id = connectable.connect(event, callback);
            return { id, connectable };
        });
        this.#onGoing.eventListeners.push(...activeELs);
    }

    #clearTimeouts() {
        this.#onGoing.timeouts.forEach(number => clearTimeout(number));
    }
}

const noOp = () => undefined;


export default class FeatureManager {
    /** @type { Map < ManagedFeature, OnGoing > } */
    #onGoings = new Map();

    new(/** @type { NewParams } */ { onEnable = noOp, onDisable = noOp, eventListeners = [] }) {
        const onGoing = new OnGoing();
        const newFeature = new ManagedFeature(onEnable, onDisable, eventListeners, onGoing);
        this.#onGoings.set(newFeature, onGoing);
        return newFeature;
    }


    newWithTimeouts(/** @type {NewParamsBuilder} */ foo) {
        /** @type {Set<number>} */
        const activeTimeouts = new Set();
        /** @type {typeof setTimeout} */
        const wrappedSetTimeout = (...args) => {
            const id = globalThis.setTimeout(...args);
            activeTimeouts.add(id);
            return id;
        };
        const newFeature = this.new(foo(wrappedSetTimeout));
        this.#onGoings.get(newFeature).timeouts = activeTimeouts;
        return newFeature;
    }

    disableAll() {
        return this.#onGoings.forEach((registeredFeature, featureHandle) => featureHandle.disable());
    }
}
