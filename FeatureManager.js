
/** @typedef EventListenerData @type { { connectable: Connectable, event: String, callback: Function } } */
/** @typedef ConnectFunction @type { (event: string, callback: Function) => number } */
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
     * @param {Set<number>} activeTimeouts
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
            const id = connectable.connect(event, callback);
            return { id, connectable };
        });
        this.#activeEventListeners.push(...activeELs);
    }

    #clearTimeouts() {
        this.#activeTimeouts.forEach(number => clearTimeout(number));
    }
}

const noOp = () => undefined;


export default class FeatureManager {
    /** @type { Map < ManagedFeature, { eventListeners: ActiveEventListener[]; timeouts: Set<number> } > } */
    #features = new Map();

    new({ onEnable = noOp, onDisable = noOp, eventListeners = [] }) {
        const activeEventListeners = [];
        const newFeature = new ManagedFeature(onEnable, onDisable, eventListeners, activeEventListeners, undefined);
        this.#features.set(newFeature, { eventListeners: activeEventListeners, timeouts: undefined });
        return newFeature;
    }

    newWithTimeouts(foo) {
        /** @type {Set<number>} */
        const activeTimeouts = new Set();
        /** @type {typeof setTimeout} */
        const wrappedSetTimeout = (...args) => {
            const id = setTimeout(...args);
            activeTimeouts.add(id);
            return id;
        };
        const newFeature = this.new(foo(wrappedSetTimeout));
        this.#features.get(newFeature).timeouts = activeTimeouts;
    }

    disableAll() {
        return this.#features.forEach((registeredFeature, featureHandle) => featureHandle.disable());
    }
}
