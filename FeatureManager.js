/** @typedef ConnectionHandler @type {Function} */
/** @typedef ConnectFunction @type {(event:string, callback: ConnectionHandler) => number} */
/** @typedef DisconnectFunction @type {(id: number) => void} */

/** @typedef SetTimeoutTool @type {typeof globalThis.setTimeout} */
/** @typedef Toolbox @type {{setTimeout: SetTimeoutTool}} */


/** @typedef FeatureFactory @type {(tools: Toolbox) => Feature} */

/** @typedef Connectable @type {{connect: ConnectFunction, disconnect: DisconnectFunction}} */
/** @typedef EventListener1 @type {{connectable: Connectable, event: string, callback: ConnectionHandler}} */
/** @typedef Feature @type {{onEnable?:Function, onDisable?: Function, eventListeners?: Array<EventListener1>}} */

/** @typedef ActiveEventListenerData @type {{connectable: Connectable, id: number}} */
/** @typedef EnabledFeatureData @type {{feature: Feature, eventListeners:Set<ActiveEventListenerData>, timeouts:Set<number>}} */


class FeatureManager {

    #features;
    /** @type {Map<FeatureFactory,EnabledFeatureData>} */
    #enabledFeatures;


    constructor(/** @type {Set<FeatureFactory>} */ features) {
        this.#features = features;
        this.#enabledFeatures = new Map();
    }

    /** @returns {void} */
    enableAll() {
        return this.#features.forEach(featureFactory => this.enable(featureFactory));
    }

    /** @returns {void} */
    disableAll() {
        return this.#enabledFeatures.forEach((featureData, featureFactory) => this.disable(featureFactory));
    }

    /** @returns {boolean} */
    enable(/** @type {FeatureFactory} */ featureFactory) {

        const existingFeatData = this.#enabledFeatures.get(featureFactory);
        if (existingFeatData) {
            return false;
        } else {
            const featData = { eventListeners: new Set(), timeouts: new Set() };

            /** @type {SetTimeoutTool} */
            const setTimeout = (handler, timeout, ...args) => {
                const id = globalThis.setTimeout(handler, timeout, ...args);
                featData.timeouts.add(id);
                return id;
            };

            const feature = featureFactory({ setTimeout });
            feature.onEnable?.();
            feature.eventListeners?.forEach(({ connectable, event, callback }) => {
                const id = connectable.connect(event, callback);
                featData.eventListeners.add({ connectable, id });
            });

            this.#enabledFeatures.set(featureFactory, { ...featData, feature });
            return true;
        }

    }

    /** @returns {boolean} */
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
        } else {
            return false;
        }

    }
}

export default class FeatureManagerBuilder {
    #features;
    constructor(/** @type {Set<FeatureFactory>} */ features = new Set()) {
        this.#features = features;
    }

    static empty() {
        return new FeatureManagerBuilder();
    }

    addFeature(/** @type {FeatureFactory} */ ff) {
        const newSet = new Set([...this.#features, ff]);
        return new FeatureManagerBuilder(newSet);
    }

    build() {
        return new FeatureManager(this.#features);
    }

}



/*// Example use 


const eventListener1 = ({
    connectable: { connect: () => 4, disconnect: () => { } },
    event: "show",
    callback: console.log
});

const featureFactory1 = ({ setTimeout }) => ({ onEnable: console.log, onDisable: console.log, eventListeners: [eventListener1] });
const fm = FeatureManagerBuilder.empty().addFeature(featureFactory1).build();
fm.enableAll();



// End of example */