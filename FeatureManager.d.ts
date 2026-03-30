type ConnectionHandler = Function;
type ConnectFunction = (event: string, callback: ConnectionHandler) => number;
type DisconnectFunction = (id: number) => void;
type SetTimeoutTool = typeof globalThis.setTimeout;
type Toolbox = {
    setTimeout: SetTimeoutTool;
};
type Feature = {
    onEnable?: Function;
    onDisable?: Function;
    eventListeners?: ReadonlyArray<EventListener>;
};
type CreateFeature = (tools: Toolbox) => Feature;
type EventListener = {
    connectable: Connectable;
    event: string;
    callback: ConnectionHandler;
};
type Connectable = {
    connect: ConnectFunction;
    disconnect: DisconnectFunction;
};
declare class FeatureManager {
    #private;
    constructor(features: Set<CreateFeature>);
    enableAll(): void;
    disableAll(): void;
    enable(featureFactory: CreateFeature): boolean;
    disable(featureFactory: CreateFeature): boolean;
}
export default class FeatureManagerConfig {
    #private;
    constructor(features?: Set<CreateFeature>);
    static empty(): FeatureManagerConfig;
    addFeature(ff: CreateFeature): FeatureManagerConfig;
    build(): FeatureManager;
}
export {};
