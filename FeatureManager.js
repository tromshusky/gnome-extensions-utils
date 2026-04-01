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
 * @typedef { ( tools: Toolbox ) => CompiledFeature } Feature
 * @typedef {{
 *   onEnable?: Function,
 *   onDisable?: Function,
 *   eventListeners?: ReadonlyArray<EventListener>
 * }} CompiledFeature
 * 
 * @typedef {{ timeouts: Set<number>, eventListeners: Set<ActiveEventListenerData>, feature: CompiledFeature }} EnabledFeature
 * 
 * @typedef {{ connect: ConnectFunction, disconnect: DisconnectFunction }} Connectable
 * @typedef {{ connectable: Connectable, id: number }} ActiveEventListenerData
 * @typedef { typeof globalThis.setTimeout } SetTimeout
 * @typedef { (...args: any[]) => true | unknown } ConnectionHandler
 * @typedef { ( event: string, callback: ConnectionHandler ) => number } ConnectFunction
 * @typedef { ( id: number ) => void } DisconnectFunction
*/

//TODO
//FIXME
// The reason i had a builder pattern (FeatureManagerConfig), was to enforce the registration of all features before using them, so features can cross reference each other.
// With the current implementation, it is not enforced.

class FeatureManager {
    #features;
    /** @type {Map<Feature, EnabledFeature>} */
    #enabledFeatures = new Map();
    constructor(/** @type {Set<Feature>} */ features) {
        this.#features = features;
    }

    enableAll() {
        return this.enableMore(...this.#features);
    }

    disableAll() {
        return this.disableMore(...this.#enabledFeatures.keys());
    }

    enableMore(/** @type {Feature[]} */ ...features) {
        return features.map(f => this.enable(f));
    }

    disableMore(/** @type {Feature[]} */ ...features) {
        return features.map(f => this.disable(f));
    }

    enable(/** @type {Feature} */ feature) {
        const existingFeatData = this.#enabledFeatures.get(feature);
        if (existingFeatData) {
            return false;
        } else {
            const eventListeners = new Set();
            const timeouts = new Set();
            const setTimeout = /** @type {SetTimeout} */ (handler, timeout, ...args) => {
                const id = globalThis.setTimeout(handler, timeout, ...args);
                timeouts.add(id);
                return id;
            };
            const newFeature = feature({ setTimeout });
            newFeature.onEnable?.();
            newFeature.eventListeners?.forEach(({ connectable, event, callback }) => {
                const id = connectable.connect(event, callback);
                eventListeners.add({ connectable, id });
            });
            this.#enabledFeatures.set(feature, { timeouts, eventListeners, feature: newFeature });
            return true;
        }
    }

    disable(/** @type {Feature} */ feature) {
        const existingFeatData = this.#enabledFeatures.get(feature);
        if (existingFeatData) {
            existingFeatData.timeouts.forEach(id => {
                globalThis.clearTimeout(id);
            });
            existingFeatData.eventListeners.forEach(el => {
                el.connectable.disconnect(el.id);
            });
            existingFeatData.feature.onDisable?.();
            this.#enabledFeatures.delete(feature);
            return true;
        } else {
            return false;
        }
    }

}

class FeatureManagerConfig {
    /** @type {Set<Feature>} */
    #features;
    constructor(features = new Set()) {
        this.#features = features;
    }
    addFeature(/** @type {Feature} */ createFeature) {
        const newSet = new Set([...this.#features, createFeature]);
        return new FeatureManagerConfig(newSet);
    }
    build() {
        return new FeatureManager(this.#features);
    }
}

export default { empty: () => new FeatureManagerConfig() };
export const Feature = (/** @type { Feature | CompiledFeature } */ feature) => (typeof feature === "function") ? feature : () => feature;