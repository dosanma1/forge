import { attrTimestamps } from './attributes';
import { getAttributeProperties } from './decorators/attribute.decorator';
import { getMetaProperties } from './decorators/meta.decorator';
import { getNestedAttributeProperties } from './decorators/nested-attribute.decorator';
import { getRelationshipProperties } from './decorators/relationship.decorator';
import { getResourceConfig } from './decorators/resource-config.decorator';
import { getWrappedProperties } from './decorators/wrapped.decorator';
import { Document, IDocument, IncludedResources } from './document';
import { HttpMethod } from './http/constants';
import { IMeta } from './meta';
import { ModelType } from './model/model';
import { IResource } from './model/resource';
import { relationship } from './relationships';
import { resource, resourceIdentifier } from './resource';

const defaultEncoderConfigOpts = (): EncoderOpt[] => {
	return [Encoder.encodeAsClient(HttpMethod.Post)];
};

export class EncoderConfig {
	mustHaveEmptyId: boolean;
	mustHaveEmptyTimestamps: boolean;
	mapIncluded: boolean;
	rootMeta: any;

	included: { [key: string]: resource };

	constructor(...opts: EncoderOpt[]) {
		for (const opt of [...defaultEncoderConfigOpts(), ...opts]) {
			opt(this);
		}
	}
}

export type EncoderOpt = (c: EncoderConfig) => void;

export class Encoder<R extends IResource> {
	public Encode(resource: R, ...opts: EncoderOpt[]): IDocument<R> {
		if (!resource) return null;

		const modelType = resource.constructor as ModelType<R>;

		const doc: Document<R> = serialize(modelType, resource, ...opts);

		return doc;
	}

	public EncodeCollection(
		resources: R[],
		...opts: EncoderOpt[]
	): IDocument<R[]> {
		if (!resources) return null;

		const modelType = resources[0].constructor as ModelType<R>;

		const docCollection: Document<R[]> = serializeCollection(
			modelType,
			resources,
			...opts,
		);

		return docCollection;
	}

	static encodeWithRootMeta = (rootMeta: any): EncoderOpt => {
		return (c: EncoderConfig) => {
			c.rootMeta = rootMeta;
		};
	};

	static encodeAsClient = (method: string): EncoderOpt => {
		return (c: EncoderConfig) => {
			c.mustHaveEmptyId = method === HttpMethod.Post;
			c.mustHaveEmptyTimestamps =
				method === HttpMethod.Patch ||
				method === HttpMethod.Delete ||
				method === HttpMethod.Post ||
				method === HttpMethod.Put;
			c.mapIncluded =
				method !== HttpMethod.Post &&
				method !== HttpMethod.Patch &&
				method !== HttpMethod.Put &&
				method !== HttpMethod.Delete;
		};
	};

	static encodeAsServer = (): EncoderOpt => {
		return (c: EncoderConfig) => {
			c.mustHaveEmptyId = false;
			c.mustHaveEmptyTimestamps = false;
			c.mapIncluded = true;
		};
	};
}

const serialize = <R extends IResource>(
	modelType: ModelType<R>,
	data: R,
	...opts: EncoderOpt[]
): Document<R> => {
	const config = new EncoderConfig(...opts);
	const resourceConfig = getResourceConfig(modelType);

	const doc: Document<R> = new Document();

	const attributes = transformAttributes(modelType, data);
	const relationships = transformRelationships(modelType, data);
	const meta = transformMeta(modelType, data);

	const resProps: any = {
		type: resourceConfig.type,
	};
	if (!config.mustHaveEmptyId) {
		resProps.id = data.ID();
	}

	if (Object.keys(attributes).length > 0) {
		resProps.attributes = attributes;
		if (config.mustHaveEmptyTimestamps) {
			delete resProps.attributes[attrTimestamps];
		}
	}

	if (Object.keys(relationships).length > 0) {
		resProps.relationships = relationships;
	}

	if (Object.keys(meta).length > 0) {
		resProps.meta = meta;
	}

	doc.data = resProps;
	doc.meta = setRootMeta(config.rootMeta);
	if (config.mapIncluded) {
		doc.included = fillIncludesFromRelationships(modelType, data, ...opts);
	}

	return doc;
};

const serializeCollection = <R extends IResource>(
	modelType: ModelType<R>,
	data: R[],
	...opts: EncoderOpt[]
): Document<R[]> => {
	const config = new EncoderConfig(...opts);
	const resourceConfig = getResourceConfig(modelType);

	const doc: Document<R[]> = new Document();

	const res: resource[] = [];
	const incl: resource[] = [];
	for (const d of data) {
		const attributes = transformAttributes(modelType, d);
		const relationships = transformRelationships(modelType, d);
		const meta = transformMeta(modelType, d);

		const resProps: any = {
			id: d.ID(),
			type: resourceConfig.type,
		};

		if (Object.keys(attributes).length > 0) {
			resProps.attributes = attributes;
		}

		if (Object.keys(relationships).length > 0) {
			resProps.relationships = relationships;
		}

		if (Object.keys(meta).length > 0) {
			resProps.meta = meta;
		}

		res.push(resProps);
		incl.push(...fillIncludesFromRelationships(modelType, d, ...opts));
	}

	doc.data = res;
	doc.meta = setRootMeta(config.rootMeta);
	if (config.mapIncluded) {
		doc.included = incl.reduce((acc, current) => {
			const x = acc.find((item) => item.id === current.id);
			if (!x) {
				return acc.concat([current]);
			} else {
				return acc;
			}
		}, []);
	}

	return doc;
};

const setRootMeta = (rootMeta: any): IMeta => {
	if (!rootMeta) return undefined;
	return rootMeta;
};

const transformAttributes = <R extends IResource>(
	modelType: ModelType<R>,
	resource: R,
): any => {
	const properties: any = {};

	// Attributes
	const serializedNameToPropertyName = getAttributeProperties(
		modelType.prototype,
	);
	Object.keys(serializedNameToPropertyName).forEach((serializedName) => {
		const attributeProperty = serializedNameToPropertyName[serializedName];
		const attr = resource[attributeProperty.key];
		if (attr !== null && attr !== undefined) {
			if (attr instanceof Map) {
				properties[serializedName] = Object.fromEntries(
					resource[serializedName].entries(),
				);
			} else {
				if (attributeProperty.transformer) {
					properties[serializedName] =
						attributeProperty.transformer.serialize(
							resource[serializedName],
						);
				} else {
					properties[serializedName] = resource[serializedName];
				}
			}
		}
	});

	const nestedProperties = transformNestedAttributes(modelType, resource);

	return Object.assign(properties, nestedProperties);
};

const transformNestedAttributes = <R extends IResource>(
	modelType: ModelType<R>,
	resource: R,
): any => {
	const properties: any = {};

	const serializedNameToNestedPropertyName = getNestedAttributeProperties(
		modelType.prototype,
	);
	Object.keys(serializedNameToNestedPropertyName).forEach(
		(serializedName) => {
			const nestedProperty =
				serializedNameToNestedPropertyName[serializedName];
			const nestedAttr = resource[nestedProperty.key];
			if (nestedAttr !== null && nestedAttr !== undefined) {
				if (Array.isArray(nestedAttr)) {
					properties[serializedName] = [];

					nestedAttr.forEach((el, index) => {
						properties[serializedName][index] = transformWrapped(
							nestedProperty,
							el,
						);
					});
				} else if (typeof nestedAttr === 'object') {
					properties[serializedName] = transformWrapped(
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
	const properties = {};
	const serializedNameToWrappedPropertyName = getWrappedProperties(
		nestedProperty.target,
	);

	Object.keys(serializedNameToWrappedPropertyName).forEach(
		(subSerializedName) => {
			if (!wrapped) return null;
			const wrappdProperty =
				serializedNameToWrappedPropertyName[subSerializedName];
			const subAttr = wrapped[wrappdProperty.key];

			if (subAttr !== null && subAttr !== undefined) {
				if (wrappdProperty.transformer) {
					properties[subSerializedName] =
						wrappdProperty.transformer.serialize(subAttr);
				} else {
					properties[subSerializedName] = subAttr;
				}
			}
		},
	);
	return properties;
};

const transformMeta = <R extends IResource>(
	modelType: ModelType<R>,
	resource: R,
): any => {
	const properties: any = {};

	const serializedNameToMetaPropertyName = getMetaProperties(
		modelType.prototype,
	);
	Object.keys(serializedNameToMetaPropertyName).forEach((serializedName) => {
		const metaProperty = serializedNameToMetaPropertyName[serializedName];
		const m = resource[metaProperty.key];
		if (m !== null && m !== undefined) {
			if (m instanceof Map) {
				properties[serializedName] = Object.fromEntries(
					resource[serializedName].entries(),
				);
			} else if (Array.isArray(m)) {
				properties[serializedName] = [];

				metaProperty.forEach((el, index) => {
					properties[serializedName][index] = transformWrapped(
						metaProperty,
						el,
					);
				});
			} else if (typeof m === 'object') {
				properties[serializedName] = transformWrapped(metaProperty, m);
			} else {
				properties[serializedName] = resource[serializedName];
			}
		}
	});

	return properties;
};

const transformRelationships = <R extends IResource>(
	modelType: ModelType<R>,
	resource: R,
): any => {
	const properties: any = {};

	const serializedNameToRelationshipPropertyName = getRelationshipProperties(
		modelType.prototype,
	);
	Object.keys(serializedNameToRelationshipPropertyName).forEach(
		(serializedName) => {
			const relProperty =
				serializedNameToRelationshipPropertyName[serializedName];
			const rel = resource[relProperty.key];
			if (rel !== undefined) {
				const relationshipConfig = getResourceConfig(
					relProperty.target,
				);

				if (rel === null) {
					properties[serializedName] = new relationship({
						data: null,
					});
				} else if (Array.isArray(rel)) {
					properties[serializedName] = {
						data: [],
					};

					const resIdentf: resourceIdentifier[] = [];
					rel.forEach((el) => {
						resIdentf.push(
							new resourceIdentifier({
								id: el.id,
								type: relationshipConfig.type ?? el.type,
							}),
						);
					});
					properties[serializedName] = new relationship({
						data: resIdentf,
					});
				} else if (typeof rel === 'object') {
					properties[serializedName] = new relationship({
						data: new resourceIdentifier({
							id: rel.id,
							type: relationshipConfig.type ?? rel.type,
						}),
					});
				}
			}
		},
	);

	return properties;
};

const fillIncludesFromRelationships = <R extends IResource>(
	modelType: ModelType<R>,
	res: R,
	...opts: EncoderOpt[]
): resource[] => {
	const inclRes: IncludedResources = new Map();

	const serializedNameToRelationshipPropertyName = getRelationshipProperties(
		modelType.prototype,
	);

	Object.keys(serializedNameToRelationshipPropertyName).forEach(
		(serializedName) => {
			const relProperty =
				serializedNameToRelationshipPropertyName[serializedName];
			const rel = res[relProperty.key];

			if (rel) {
				if (Array.isArray(rel)) {
					rel.forEach((el) => {
						const doc = serialize(relProperty.target, el, ...opts);

						inclRes.set(`${doc.data.id}${doc.data.type}`, doc.data);
					});
				} else if (typeof rel === 'object') {
					const doc = serialize(relProperty.target, rel, ...opts);
					inclRes.set(`${doc.data.id}${doc.data.type}`, doc.data);
				}
			}
		},
	);

	return Array.from(inclRes, ([_, value]) => value);
};
