
/** @typedef RegisteredFeatureData @type { { onEnable: Function, onDisable: Function, eventListeners: Array<EventListenerData> } }  */
/** @typedef EventListenerData @type { { connectable: Connectable, event: String, callback: Function } } */
/** @typedef Connectable @type { { connect: (event: string, callback: Function) => number, disconnect: (id: number) => undefined } } */
/** @typedef ActiveEventListener @type { { id: number, connectable: Connectable } } */

class ManagedFeature {

    #onEnable;
    #onDisable;
    #eventListeners;
    #activeEventListeners;

    /**
     * @param {Function} onEnable
     * @param {Function} onDisable
     * @param {EventListenerData[]} eventListeners
     * @param {ActiveEventListener[]} activeEventListeners
     */
    constructor(onEnable, onDisable, eventListeners, activeEventListeners) {
        this.#onEnable = onEnable;
        this.#onDisable = onDisable;
        this.#eventListeners = eventListeners;
        this.#activeEventListeners = activeEventListeners;
    }

    enable() {
        this.#onEnable();
        this.#connect();
    }

    disable() {
        this.#onDisable();
        this.#disconnect();
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
}

const noOp = () => undefined;

export default class FeatureManager {
    /** @type {Map<ManagedFeature,Array<ActiveEventListener>>} */
    #features = new Map();

    /**
     * @param {Function} onEnable
     * @param {Function} onDisable
     * @param {Array<EventListenerData>} eventListeners
     */
    new(onEnable = noOp, onDisable = noOp, eventListeners = []) {
        const activeEventListenerStorage = [];
        const newFeature = new ManagedFeature(onEnable, onDisable, eventListeners, activeEventListenerStorage);
        this.#features.set(newFeature, activeEventListenerStorage);
        return newFeature;
    }

    disableAll() {
        return this.#features.forEach((registeredFeature, featureHandle) => featureHandle.disable());
    }
}
