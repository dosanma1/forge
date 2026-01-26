import { ModelType } from '../model/model';

const META_METADATA_KEY: string = 'meta:metadata';

export function getMetaProperties(target: any): any {
	return Reflect.getMetadata(META_METADATA_KEY, target) || [];
}

export interface MetaDecoratorOptions {
	type?: ModelType<any>;
	root?: boolean;
	serializedName?: string;
}

export function Meta(options: MetaDecoratorOptions = {}): PropertyDecorator {
	return (target: object, propertyKey: string | symbol) => {
		const mappingMetadata = Reflect.getMetadata(META_METADATA_KEY, target) || {};
		const serializedPropertyName = options.serializedName !== undefined ? options.serializedName : propertyKey;
		mappingMetadata[serializedPropertyName] = {
			target: options.type ?? target.constructor,
			key: propertyKey,
			root: options.root
		};
		Reflect.defineMetadata(META_METADATA_KEY, mappingMetadata, target);
	};
}
