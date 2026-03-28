/** @typedef ConnectFunction @type {Function} */
/** @typedef DisconnectFunction @type {Function} */
/** @typedef Connectable @type {{connect:ConnectFunction, disconnect:DisconnectFunction}} */

/** @typedef OnEnablePreFunction @type {(tools: OnEnableToolbox) => void} */
/** @typedef OnDisableFunction @type {Function} */

/** @typedef SetTimeoutTool @type {typeof globalThis.setTimeout} */
/** @typedef OnEnableToolbox @type {{setTimeout: SetTimeoutTool}} */

/** @typedef FeatureSchema @type {{onEnable?: OnEnablePreFunction, onDisable?: OnDisableFunction}} */

/** @typedef SetTimeout @type {globalThis.setTimeout} */

const noop = () => { };

class EventListenerSchema {
    /** @type Connectable */
    connectable;
    /** @type string */
    event;
    /** @type Function */
    callback;
}


class Feature {
    /** @type OnEnablePreFunction */
    onEnable;
    /** @type OnDisableFunction */
    onDisable;
    constructor(/** @type FeatureSchema */ f) {
        this.onEnable = f?.onEnable ?? noop;
        this.onDisable = f?.onDisable ?? noop;
    }
}

class FeatureData {
    /** @type {Set<number>} */
    timeouts;
    /** @type {Set} */
    eventListeners;
}


class FeatureManager {
    /** @type {Map<Feature,FeatureData} */
    #features;
    enable(/** @type {Feature} */ feat) {
        const existingFeature = this.#features.get(feat);
        const timeouts = existingFeature?.timeouts ?? new Set();
        const eventListeners = existingFeature?.eventListeners ?? new Set();
        if (!existingFeature) {

            this.#features.set(feat, { timeouts, eventListeners });
        }

        const /** @type {SetTimeout} */ wrappedSetTimeout = (callback, time, ...args) => {
            const id = globalThis.setTimeout(callback, time, ...args);
            timeouts.add(id);
            return id;
        }
        feat.onEnable({ setTimeout: wrappedSetTimeout })
    }
    disable(/** @type {Feature} */ feat) {
        const timeouts = this.#features.get(feat);
        timeouts.forEach(id => globalThis.clearTimeout(id));
        this.#features.delete(feat);
        feat.onDisable();
    }
    disableAll() {
        this.#features.forEach((timeouts, feature) => this.disable(feature));
    }
}

// example usage
const fm = new FeatureManager();

const feat1onEnable = (/** @type OnEnableToolbox */ { setTimeout }) => {
    console.log("feature 1 enabled");
    setTimeout(() => console.log("10 seconds passed"), 10000);
    fm.enable(feat2);
}
const feat1onDisable = () => {
    console.log("feature 1 disabled");
}

const feat1 = new Feature({ onEnable: feat1onEnable, onDisable: feat1onDisable });
const feat2 = new Feature({
    onEnable: () => {
        fm.disable(feat1);
        console.log("feature2 enabled");
    }
});

fm.enable(feat1);
