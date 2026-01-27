import { Transformer } from '../transformers/transformer';

const ATTRIBUTE_METADATA_KEY: string = 'attribute:metadata';

export function getAttributeProperties(target: any): any {
	return Reflect.getMetadata(ATTRIBUTE_METADATA_KEY, target) || [];
}

export interface AttributeDecoratorOptions {
	serializedName?: string;
	transformer?: Transformer;
}

export function Attribute(options: AttributeDecoratorOptions = {}): PropertyDecorator {
	return (target: any, propertyKey: string | symbol) => {
		const mappingMetadata = Reflect.getMetadata(ATTRIBUTE_METADATA_KEY, target) || {};
		const serializedPropertyName = options.serializedName !== undefined ? options.serializedName : propertyKey;
		mappingMetadata[serializedPropertyName] = {
			target: target.constructor,
			key: propertyKey,
			transformer: options.transformer
		};
		Reflect.defineMetadata(ATTRIBUTE_METADATA_KEY, mappingMetadata, target);
	};
}
