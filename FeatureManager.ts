type ConnectionHandler = Function;
type ConnectFunction = (event: string, callback: ConnectionHandler) => number;
type DisconnectFunction = (id: number) => void;
type SetTimeoutTool = typeof globalThis.setTimeout;
type Toolbox = { setTimeout: SetTimeoutTool };
type Feature = { onEnable?: Function, onDisable?: Function, eventListeners?: ReadonlyArray<EventListener> };
type CreateFeature = (tools: Toolbox) => Feature;
type EventListener = { connectable: Connectable, event: string, callback: ConnectionHandler };
type Connectable = { connect: ConnectFunction, disconnect: DisconnectFunction };
type ActiveEventListenerData = { connectable: Connectable, id: number };
type EnabledFeatureData = { feature: Feature, eventListeners: Set<ActiveEventListenerData>, timeouts: Set<number> };

class FeatureManager {

    #features;
    #enabledFeatures;


    constructor(features: Set<CreateFeature>) {
        this.#features = features;
        this.#enabledFeatures = new Map<CreateFeature, EnabledFeatureData>();
    }

    enableAll(): void {
        return this.#features.forEach(featureFactory => this.enable(featureFactory));
    }

    disableAll(): void {
        return this.#enabledFeatures.forEach((_, featureFactory) => this.disable(featureFactory));
    }

    enable(featureFactory: CreateFeature): boolean {

        const existingFeatData = this.#enabledFeatures.get(featureFactory);
        if (existingFeatData) {
            return false;
        } else {
            const eventListeners = new Set<ActiveEventListenerData>();
            const timeouts = new Set<number>();

            const setTimeout: SetTimeoutTool = (handler, timeout, ...args) => {
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

    disable(featureFactory: CreateFeature): boolean {

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

export default class FeatureManagerConfig {
    #features;
    constructor(features = new Set<CreateFeature>()) {
        this.#features = features;
    }

    static empty() {
        return new FeatureManagerConfig();
    }

    addFeature(ff: CreateFeature) {
        const newSet = new Set([...this.#features, ff]);
        return new FeatureManagerConfig(newSet);
    }

    build() {
        return new FeatureManager(this.#features);
    }

}

/*
// Example use 

type EventListenerFactory = (tools: Toolbox) => EventListener;

const eventListener1: EventListenerFactory = ({ setTimeout }) => ({
    connectable: { connect: () => 4, disconnect: () => { } },
    event: "show",
    callback: () => { setTimeout(() => { console.log("hi") }, 1000) }
});

const featureFactory1: CreateFeature = ({ setTimeout }) => ({ onEnable: console.log, onDisable: console.log, eventListeners: [eventListener1({ setTimeout })] });
const fm = FeatureManagerConfig.empty().addFeature(featureFactory1).build();
fm.enableAll();



// End of example */