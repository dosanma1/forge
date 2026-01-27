import { ModelType } from '../model/model';

const NESTED_ATTRIBUTE_METADATA_KEY: string = 'nested-attribute:metadata';

export function getNestedAttributeProperties(target: any): any {
	const commonMetadata = Reflect.getMetadata(NESTED_ATTRIBUTE_METADATA_KEY, target);
	const targetMetadata = Object.getPrototypeOf(target) === Object.prototype ? [] : Reflect.getMetadata(NESTED_ATTRIBUTE_METADATA_KEY, target.constructor);
	return { ...commonMetadata, ...targetMetadata };
}

export interface NestedAttributeDecoratorOptions {
	type: ModelType<any>;
	serializedName?: string;
}

export function NestedAttribute(options: NestedAttributeDecoratorOptions): PropertyDecorator {
	return (target: object, propertyKey: string | symbol) => {
		const constructor = Object.getPrototypeOf(target) === Object.prototype ? target : target.constructor;
		const mappingMetadata = Reflect.getMetadata(NESTED_ATTRIBUTE_METADATA_KEY, constructor) || {};
		const serializedPropertyName = options.serializedName !== undefined ? options.serializedName : propertyKey;
		mappingMetadata[serializedPropertyName] = {
			target: options.type,
			key: propertyKey
		};
		Reflect.defineMetadata(NESTED_ATTRIBUTE_METADATA_KEY, mappingMetadata, constructor);
	};
}
