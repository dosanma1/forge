const RESOURCE_CONFIG_METADATA_KEY: string = 'resource-config:metadata';

export function getResourceConfig(target: any): IResourceConfig {
    return Reflect.getMetadata(RESOURCE_CONFIG_METADATA_KEY, target) || [];
}

export interface IResourceConfig {
    type: string;
}

export function ResourceConfig(config: IResourceConfig): ClassDecorator {
    return (target: any) => {
        Reflect.defineMetadata(RESOURCE_CONFIG_METADATA_KEY, config, target);
    };
}
