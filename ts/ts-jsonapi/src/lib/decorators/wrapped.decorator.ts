import { Transformer } from '../transformers/transformer';

const WRAPPED_METADATA_KEY: string = 'wrapped:metadata';

export function getWrappedProperties(target: any): any {
	return Reflect.getMetadata(WRAPPED_METADATA_KEY, target) || [];
}

export interface WrappedDecoratorOptions {
	serializedName?: string;
	transformer?: Transformer;
}

export function Wrapped(options: WrappedDecoratorOptions = {}): PropertyDecorator {
	return (target: object, propertyKey: string | symbol) => {
		const mappingMetadata = Reflect.getMetadata(WRAPPED_METADATA_KEY, target.constructor) || {};
		const serializedPropertyName = options && options.serializedName !== undefined ? options.serializedName : propertyKey;
		mappingMetadata[serializedPropertyName] = {
			target: target.constructor,
			key: propertyKey,
			traformer: options.transformer
		};
		Reflect.defineMetadata(WRAPPED_METADATA_KEY, mappingMetadata, target.constructor);
	};
}
