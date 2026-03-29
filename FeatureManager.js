/** @typedef ConnectionHandler @type {(...args: any[]) => any} */
/** @typedef ConnectFunction @type {(event:string, callback: ConnectionHandler) => number} */
/** @typedef DisconnectFunction @type {(id: number) => void} */

/** @typedef SetTimeoutTool @type {typeof globalThis.setTimeout} */
/** @typedef Toolbox @type {{setTimeout: SetTimeoutTool}} */


/** @typedef FeatureFactory @type {(tools: Toolbox) => Feature} */



/** @typedef Connectable @type {{connect: ConnectFunction, disconnect: DisconnectFunction}} */
/** @typedef EventListener1 @type {{connectable: Connectable, event: string, callback: Function}} */
/** @typedef Feature @type {{onEnable?:Function, onDisable?: Function, eventListeners?: Array<EventListener1>}} */

/** @typedef EnabledFeatureData @type {{eventListeners:Set, timeouts:Set<number>}} */

const noop = () => { };


class FeatureManager {
    #features;
    /** @type {Map<FeatureFactory,EnabledFeatureData>} */
    #enabledFeatures;
    constructor(/** @type {Set<FeatureFactory>} */ features) {
        this.#features = features;
    }

    enableAll() {
        this.#features.forEach(featureFactory => {
            const existingFeatData = this.#enabledFeatures.get(featureFactory);
            const featData = existingFeatData ?? new Map();
            if (!existingFeatData) {
                this.#enabledFeatures.set(featureFactory, featData);
            };
            const setTimeout = () => {
                const id = globalThis.setTimeout(handler, timeout, ...args);
                return id;
            };
            featureFactory({ setTimeout })
        });
    }

    disableAll() {

    }

    enable(/** @type {FeatureFactory} */ f) {

    }

    disable(/** @type {FeatureFactory} */ f) {

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


/** @type {EventListener1} */
const el1 = ({
    connectable: undefined,
    event: "show",
    callback: console.log
});

/** @type {FeatureFactory} */
const ff1 = ({ setTimeout }) => ({ onEnable: console.log, onDisable: console.log, eventListeners: [el1] });
const fm = FeatureManagerBuilder.empty().addFeature(ff1).build();