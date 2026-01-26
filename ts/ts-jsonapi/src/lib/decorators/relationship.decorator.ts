import { ModelType } from '../model/model';

const RELATIONSHIP_METADATA_KEY: string = 'relationship:metadata';

export function getRelationshipProperties(target: any): any {
	return Reflect.getMetadata(RELATIONSHIP_METADATA_KEY, target) || [];
}

export interface RelationshipDecoratorOptions {
	type: ModelType<any>;
	serializedName?: string;
}

export function Relationship(options: RelationshipDecoratorOptions): PropertyDecorator {
	return (target: object, propertyKey: string | symbol) => {
		const metadata = Reflect.getMetadata(RELATIONSHIP_METADATA_KEY, target) || {};
		const serializedPropertyName = options.serializedName !== undefined ? options.serializedName : propertyKey;

		metadata[serializedPropertyName] = {
			target: options.type,
			key: propertyKey
		};
		Reflect.defineMetadata(RELATIONSHIP_METADATA_KEY, metadata, target);
	};
}
