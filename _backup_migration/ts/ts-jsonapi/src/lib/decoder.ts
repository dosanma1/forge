import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Attributes } from './attributes';
import { getAttributeProperties } from './decorators/attribute.decorator';
import { getMetaProperties } from './decorators/meta.decorator';
import { getNestedAttributeProperties } from './decorators/nested-attribute.decorator';
import { getRelationshipProperties } from './decorators/relationship.decorator';
import { getWrappedProperties } from './decorators/wrapped.decorator';
import { Document, IDocument, IncludedResources } from './document';
import { IMeta } from './meta';
import { ListResponse } from './model/list-response';
import { ModelType } from './model/model';
import { IResource } from './model/resource';
import { Relationships } from './relationships';
import { Resource, resource } from './resource';

export class Decoder<R extends IResource> {
	private _modelType: ModelType<R>;

	constructor(modelType: ModelType<R>) {
		this._modelType = modelType;
	}

	public Decode(data: object): IDocument<R> {
		if (!data) return null;

		const doc = new Document<R>(data);

		if ((doc.Errors() && doc.Errors().length > 0) || !doc.data) {
			return doc;
		}

		let included;
		if (doc.included) {
			included = new Map(
				doc.included.map((r) => [this.getIncludedKey(r), r]),
			);
		}

		doc.wdata = deserialize(this._modelType, doc.data, included);

		return doc;
	}

	public DecodeCollection(data: object): IDocument<R[]> {
		if (!data) return null;

		const doc = new Document<R[]>(data);

		if (doc.Errors() && doc.Errors().length > 0) {
			return doc;
		}

		let included;
		if (doc.included) {
			included = new Map(
				doc.included.map((r) => [this.getIncludedKey(r), r]),
			);
		}

		doc.wdata = deserializeCollection(this._modelType, doc, included);

		return doc;
	}

	private getIncludedKey(res: Resource): string {
		return `${res.ID()}${res.Type()}`;
	}
}

export type resDecoder<O> = (res: HttpEvent<object>) => O;

export const newSingleDocResponseDecoder = <R extends IResource>(
	modelType: ModelType<R>,
): resDecoder<R> => {
	return (res: HttpEvent<object>): R => {
		switch (res.type) {
			case HttpEventType.Response: {
				if (res.status == 204) {
					return null;
				}

				const d = new Decoder<R>(modelType).Decode(res.body);

				if (res.status < 200 || res.status >= 300) {
					throw new Error(d.Errors[0]);
				}

				return d.Data() as R;
			}
			default:
				throw Error('unknown http event');
		}
	};
};
export const newCollectionDocResponseDecoder = <R extends IResource>(
	modelType: ModelType<R>,
): resDecoder<ListResponse<R>> => {
	return (res: HttpEvent<object>): ListResponse<R> => {
		switch (res.type) {
			case HttpEventType.Response: {
				const d = new Decoder<R>(modelType).DecodeCollection(res.body);

				if (res.status != 200 && res.status != 201) {
					console.error(d.Errors[0]);
					return null;
				}

				return new ListResponse<R>(d.Data(), d.Meta(), d.Included());
			}
			default:
				throw Error('unknown http event');
		}
	};
};

const deserialize = <R extends IResource>(
	modelType: ModelType<R>,
	data: resource,
	included?: IncludedResources,
): R => {
	const resource: R = new modelType();

	const attributes = transformAttributes(modelType, data.Attributes());
	const meta = transformMeta(modelType, data.Meta());
	const relationships = transformRelationships(
		modelType,
		data.Relationships(),
		included,
	);

	// Fill resource
	Object.assign(resource, {
		id: data.ID(),
		lid: data.LID(),
		type: data.Type(),
	});

	// Fill attributes
	Object.assign(resource, attributes);

	// Fill relationships
	Object.assign(resource, relationships);

	// Fill meta
	Object.assign(resource, meta);

	return resource;
};

const deserializeCollection = <R extends IResource>(
	modelType: ModelType<R>,
	doc: Document<R[]>,
	included?: IncludedResources,
): R[] => {
	const resources: R[] = [];
	for (const data of doc.data) {
		const item: R = deserialize(modelType, data, included);
		resources.push(item);
	}

	return resources;
};

const transformAttributes = <R extends IResource>(
	modelType: ModelType<R>,
	attributes: Attributes,
): any => {
	if (!attributes) return undefined;

	const properties: any = {};

	// Attributes
	const serializedNameToPropertyName = getAttributeProperties(
		modelType.prototype,
	);
	Object.keys(serializedNameToPropertyName).forEach((serializedName) => {
		const attr = attributes.get(serializedName);
		if (attr !== undefined && attr !== null) {
			const attributeProperty =
				serializedNameToPropertyName[serializedName];
			if (
				typeof attr === 'object' &&
				!Array.isArray(attr) &&
				!(attr instanceof Date)
			) {
				properties[attributeProperty.key] = new Map(
					Object.entries(attr),
				);
			} else {
				if (attributeProperty.transformer) {
					properties[attributeProperty.key] =
						attributeProperty.transformer.deserialize(attr);
				} else {
					properties[attributeProperty.key] = attr;
				}
			}
		}
	});

	const nestedProperties = transformNestedAttributes(modelType, attributes);

	return Object.assign(properties, nestedProperties);
};

const transformNestedAttributes = <R extends IResource>(
	modelType: ModelType<R>,
	nestedAttributes: Attributes,
): any => {
	if (!nestedAttributes) return undefined;

	const properties: any = {};

	// Nested Attributes
	const serializedNameToNestedPropertyName = getNestedAttributeProperties(
		modelType.prototype,
	);
	Object.keys(serializedNameToNestedPropertyName).forEach(
		(serializedName) => {
			const nestedAttr = nestedAttributes.get(serializedName);
			if (nestedAttr !== undefined && nestedAttr !== null) {
				const nestedProperty =
					serializedNameToNestedPropertyName[serializedName];

				if (Array.isArray(nestedAttr)) {
					properties[nestedProperty.key] = [];

					nestedAttr.forEach((el, index) => {
						properties[nestedProperty.key][index] =
							transformWrapped(nestedProperty, el);
					});
				} else if (typeof nestedAttr === 'object') {
					properties[nestedProperty.key] = transformWrapped(
						nestedProperty,
						nestedAttr,
					);
				} else {
					throw new Error(
						'transformNestedAttributes(): unexpected type',
					);
				}
			}
		},
	);

	return properties;
};

const transformWrapped = (nestedProperty: any, wrapped: any): any => {
	if (!wrapped) return undefined;

	const properties: any = {};
	const serializedNameToWrappedPropertyName = getWrappedProperties(
		nestedProperty.target,
	);

	Object.keys(serializedNameToWrappedPropertyName).forEach(
		(subSerializedName) => {
			const subAttr = wrapped[subSerializedName];

			if (subAttr !== undefined && subAttr !== null) {
				const wrappdProperty =
					serializedNameToWrappedPropertyName[subSerializedName];

				if (wrappdProperty.transformer) {
					properties[subSerializedName] =
						wrappdProperty.transformer.serialize(subAttr);
				} else {
					properties[subSerializedName] = subAttr;
				}
			}
		},
	);
	return new nestedProperty.target(properties);
};

const transformMeta = <R extends IResource>(
	modelType: ModelType<R>,
	meta: IMeta,
): any => {
	if (!meta) return undefined;

	const properties: any = {};

	// Meta
	const serializedNameToMetaName = getMetaProperties(modelType.prototype);
	Object.keys(serializedNameToMetaName).forEach((serializedName) => {
		const m = meta.get(serializedName);
		if (m !== null && m !== undefined) {
			const metaProperty = serializedNameToMetaName[serializedName];

			if (Array.isArray(m)) {
				properties[metaProperty.key] = [];

				m.forEach((el, index) => {
					properties[metaProperty.key][index] = transformWrapped(
						metaProperty,
						el,
					);
				});
			} else if (typeof m === 'object') {
				properties[metaProperty.key] = transformWrapped(
					metaProperty,
					m,
				);
			} else {
				properties[metaProperty.key] = m;
			}
		}
	});

	return properties;
};

export function transformRelationships<R extends IResource>(
	modelType: ModelType<R>,
	rels: Relationships,
	included?: IncludedResources,
): any {
	if (!rels) return undefined;

	const properties: any = {};

	// Relationship
	const serializedNameToRelationshipPropertyName = getRelationshipProperties(
		modelType.prototype,
	);
	Object.keys(serializedNameToRelationshipPropertyName).forEach(
		(serializedName) => {
			const rel = rels.get(serializedName);
			if (rel) {
				const relProperty =
					serializedNameToRelationshipPropertyName[serializedName];

				if (Array.isArray(rel.Data())) {
					properties[relProperty.key] = [];

					rel.Data().forEach((el, index) => {
						const incl = included?.get(`${el.id}${el.type}`);

						if (incl) {
							properties[relProperty.key][index] = deserialize(
								relProperty.target,
								incl,
								included,
							);
						} else {
							properties[relProperty.key][index] =
								new relProperty.target(el);
						}
					});
				} else if (typeof rel.Data() === 'object') {
					const incl = included?.get(
						`${rel.Data().id}${rel.Data().type}`,
					);

					if (incl) {
						properties[relProperty.key] = deserialize(
							relProperty.target,
							incl,
							included,
						);
					} else {
						properties[relProperty.key] = new relProperty.target(
							rel.Data(),
						);
					}
				} else {
					throw new Error(
						'transformRelationships(): unexpected type',
					);
				}
			}
		},
	);

	return properties;
}
