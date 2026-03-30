/*
// Example use
const eventListener1 = ({ setTimeout }) => ({
    connectable: { connect: () => 4, disconnect: () => { } },
    event: "show",
    callback: () => { setTimeout(() => { console.log("hi"); }, 1000); }
});
const feature1 = (tools) => ({ onEnable: console.log, onDisable: console.log, eventListeners: [eventListener1(tools)] });
const fm = FeatureManagerConfig.empty().addFeature(feature1).build();
fm.enableAll();


// End of example */

/**
 * @typedef {{
 *     connectable: Connectable,
 *     event: string,
 *     callback: ConnectionHandler
 *   }} EventListener
 * @typedef {{ setTimeout: SetTimeout }} Toolbox
 * @typedef { ( tools: Toolbox ) => Feature } FeatureFactory
 * @typedef {{
 *   onEnable?: Function,
 *   onDisable?: Function,
 *   eventListeners?: ReadonlyArray<EventListener>
 * }} Feature
 * 
 * @typedef {{ timeouts: Set<number>, eventListeners: Set<ActiveEventListenerData>, feature: Feature }} EnabledFeature
 * 
 * @typedef {{ connect: ConnectFunction, disconnect: DisconnectFunction }} Connectable
 * @typedef {{ connectable: Connectable, id: number }} ActiveEventListenerData
 * @typedef { typeof globalThis.setTimeout } SetTimeout
 * @typedef { (...args: any[]) => true | unknown } ConnectionHandler
 * @typedef { ( event: string, callback: ConnectionHandler ) => number } ConnectFunction
 * @typedef { ( id: number ) => void } DisconnectFunction
*/

class FeatureManager {
    #features;
    /** @type {Map<FeatureFactory, EnabledFeature>} */
    #enabledFeatures = new Map();
    constructor(/** @type {Set<FeatureFactory>} */ features) {
        this.#features = features;
    }

    enableAll() {
        this.#features.forEach(featureFactory => this.enable(featureFactory));
    }

    disableAll() {
        this.#enabledFeatures.forEach((_, featureFactory) => this.disable(featureFactory));
    }


    enable(/** @type {FeatureFactory} */ featureFactory) {
        const existingFeatData = this.#enabledFeatures.get(featureFactory);
        if (existingFeatData) {
            return false;
        }
        else {
            const eventListeners = new Set();
            const timeouts = new Set();
            const setTimeout = /** @type {SetTimeout} */ (handler, timeout, ...args) => {
                const id = globalThis.setTimeout(handler, timeout, ...args);
                timeouts.add(id);
                return id;
            };
            const feature = featureFactory({ setTimeout });
            feature.onEnable?.();
            feature.eventListeners?.forEach(({ connectable, event, callback }) => {
                const id = connectable.connect(event, callback);
                eventListeners.add({ connectable, id });
            });
            this.#enabledFeatures.set(featureFactory, { timeouts, eventListeners, feature });
            return true;
        }
    }

    disable(/** @type {FeatureFactory} */ featureFactory) {
        const existingFeatData = this.#enabledFeatures.get(featureFactory);
        if (existingFeatData) {
            existingFeatData.timeouts.forEach(id => {
                globalThis.clearTimeout(id);
            });
            existingFeatData.eventListeners.forEach(el => {
                el.connectable.disconnect(el.id);
            });
            existingFeatData.feature.onDisable?.();
            this.#enabledFeatures.delete(featureFactory);
            return true;
        }
        else {
            return false;
        }
    }
}

export default class FeatureManagerConfig {
    /** @type {Set<FeatureFactory>} */
    #features;
    constructor(features = new Set()) {
        this.#features = features;
    }
    static empty() {
        return new FeatureManagerConfig();
    }
    addFeature(/** @type {FeatureFactory} */ createFeature) {
        const newSet = new Set([...this.#features, createFeature]);
        return new FeatureManagerConfig(newSet);
    }
    build() {
        return new FeatureManager(this.#features);
    }
}