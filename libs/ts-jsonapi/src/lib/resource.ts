import { Attributes } from './attributes';
import { ILinks } from './links';
import { IMeta } from './meta';
import { Relationships, relationship } from './relationships';

/**
 * ResourceID acts as a UID for each resource (by type) in the system.
 * Within a given API, each resource object’s type and id pair MUST identify a single, unique resource.
 * (The set of URIs controlled by a server, or multiple servers acting as one, constitute an API.
 *
 * The type member is used to describe resource objects that share common attributes and relationships.
 * The values of type members MUST adhere to the same constraints as member names.
 **/
export interface ResourceID {
	/**
	 * Every resource object MUST contain an id member, except when the resource object
	 * originates at the client and represents a new resource to be created on the server.
	 **/
	ID(): string;

	/**
	 * If id is omitted due to the unique exception (client wants to create a new resource),
	 * a lid member MAY be included to uniquely identify the resource by type locally within
	 * the document. The value of the lid member MUST be identical for every representation
	 * of the resource in the document, including resource identifier objects.
	 **/
	LID(): string;

	/**
	 * Every resource object MUST contain a type member.
	 **/
	Type(): string;

	/**
	 * Meta object containing non-standard meta-information about a resource that
	 * can not be represented as an attribute or relationship.
	 **/
	Meta(): IMeta;
}

/**
 * Resource objects appear in a JSON:API document to represent resources.
 * A resource object MUST contain at least the following top-level members:
 *     - id
 *     - type
 *
 * Exception: The id member is not required when the resource object originates at
 * the client and represents a new resource to be created on the server.
 * In that case, a client MAY include a lid member to uniquely identify the resource by type locally within the document
 * In addition, a resource object MAY contain any of these top-level members:
 *     - attributes
 *     - relationships
 *     - links
 *     - meta
 *
 * NOTE: a resource can not have attributes and relationships with the same name.
 * Member name specs @ https://jsonapi.org/format/#document-member-names
 **/
export interface Resource extends ResourceID {
	/**
	 * Attributes object representing some of the resource’s data.
	 **/
	Attributes(): Attributes;

	/**
	 * Relationships object describing relationships between the resource and other JSON:API resources.
	 **/
	Relationships(): Relationships;

	/**
	 * Links object containing links related to the resource.
	 * If present, this links object MAY contain a self link that identifies the resource represented by the resource object.
	 * A server MUST respond to a GET request to the specified URL with a  response that includes the resource as the primary data
	 **/
	Links(): ILinks;
}

interface resourceTimestampsProps {
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

export class resourceTimestamps {
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;

	constructor(props: resourceTimestampsProps) {
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.deletedAt = props.deletedAt;
	}

	CreatedAt(): Date {
		return this.createdAt;
	}

	UpdatedAt(): Date {
		return this.createdAt;
	}

	DeletedAt(): Date {
		return this.createdAt;
	}
}

export class resourceIdentifier {
	id: string;
	lid: string;
	type: string;

	constructor(data?: any) {
		if (data) {
			this.id = data.id;
			this.lid = data.lid;
			this.type = data.type;
		}
	}

	ID(): string {
		return this.id;
	}

	LID(): string {
		return this.lid;
	}

	Type(): string {
		return this.type;
	}
}

export class resource extends resourceIdentifier implements Resource {
	attributes: Attributes;
	relationships: Relationships;

	meta: IMeta;

	constructor(data?: any) {
		super(data);

		if (data) {
			if (data.attributes) {
				if (data.attributes instanceof Map) {
					this.attributes = data.attributes;
				} else {
					this.attributes = new Map(Object.entries(data.attributes));
				}
			}

			if (data.relationships) {
				if (data.relationships instanceof Map) {
					this.relationships = data.relationships;
				} else {
					this.relationships = new Map(Object.entries(data.relationships).map((v) => [v[0], new relationship(v[1])]));
				}
			}

			if (data.meta) {
				if (data.meta instanceof Map) {
					this.meta = data.meta;
				} else {
					this.meta = new Map(Object.entries(data.meta));
				}
			}
		}
	}
	Attributes(): Attributes {
		return this.attributes;
	}

	Relationships(): Relationships {
		return this.relationships;
	}

	Meta(): IMeta {
		return this.meta;
	}

	Links(): ILinks {
		throw new Error('Method not implemented.');
	}
}
