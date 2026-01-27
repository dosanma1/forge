import { IError } from './errors';
import { ILinks } from './links';
import { IMeta } from './meta';
import { Resource, resource } from './resource';
import { ISpec, Spec } from './spec';

export const specVersion = '1.1';

/**
 * Document MUST contain at least one of the following top-level members:
 *   - data
 *   - errors
 *   - meta
 *   - a member defined by an applied extension
 *
 * The members data and errors MUST NOT coexist in the same document.
 * A document MAY contain any of these top-level members:
 *   - jsonapi (spec)
 *   - links
 *   - included
 *
 * If a document does not contain a top-level data key, the included member MUST NOT be present either.
 **/
export interface IDocument<T> {
    /**
     * The document's "primary data"
     *   Primary data MUST be either:
     *     - a single resource object, a single resource identifier object, or null,
     * 	   for requests that target single resources
     * 	 - an array of resource objects, an array of resource identifier objects,
     * 	   or an empty array ([]), for requests that target resource collections
     *   A logical collection of resources MUST be represented as an array, even if
     *   it only contains one item or is empty.
     **/
    Data(): T;

    /**
     * An array of error objects
     **/
    Errors(): IError[];

    /**
     * A meta object that contains non-standard meta-information
     * The value of each meta member MUST be an object (a “meta object”).
     * Any members MAY be specified within meta objects.
     * For example:
     *
     * {
     * 	"meta": {
     * 		"copyright": "Copyright 2015 Example Corp.",
     * 		"authors": [
     * 			"Yehuda Katz",
     * 		    "Steve Klabnik",
     * 		    "Dan Gebhardt",
     * 		    "Tyler Kellen"
     * 		]
     * 	},
     *	"data": {
     * 		// ...
     * 	}
     * }
     **/
    Meta(): IMeta;

    /**
     * An object describing the server’s implementation.
     **/
    Spec(): ISpec;

    /**
     * A links object related to the primary data.
     * MAY contain the following members:
     * 	- self: the link that generated the current response document.
     * 	  If a document has extensions or profiles applied to it, this link
     * 	  SHOULD be represented by a link object with the type target attribute specifying
     * 	  the JSON:API media type with all applicable parameters.
     * 	- related: a related resource link when the primary data represents a resource relationship.
     * 	- describedby: a link to a description document (e.g. OpenAPI or JSON Schema) for
     * 	  the current document.
     * 	- pagination links for the primary data.
     * Note: The self link in the top-level links object allows a client to refresh the data represented
     * by the current response document. The client should be able to use the provided link without
     * applying any additional information. Therefore the link must contain the query parameters
     * provided by the client to generate the response document.
     * This includes but is not limited to query parameters used for [inclusion of related resources]
     * [fetching resources], [sparse fieldsets][fetching sparse fieldsets], [sorting][fetching sorting],
     * [pagination][fetching pagination] and [filtering][fetching filtering]
     **/
    Links(): ILinks;

    /**
     * An array of resource objects that are related to the primary data
     * and/or each other (“included resources”)
     * Servers MAY allow responses that include related resources along with the
     * requested primary resources. Such responses are called “compound documents”.
     * In a compound document, all included resources MUST be represented as an array
     * of resource objects in a top-level included member.
     * Every included resource object MUST be identified via a chain of relationships
     * originating in a document’s primary data. This means that compound documents
     * require “full linkage” and that no resource object can be included without a
     * direct or indirect relationship to the document’s primary data.
     * The only exception to the full linkage requirement is when relationship fields
     * that would otherwise contain linkage data are excluded due to sparse fieldsets
     * requested by the client.
     * A compound document MUST NOT include more than one resource object for each
     * type and id pair. This approach ensures that a single canonical resource object
     * is returned with each response, even when the same resource is referenced
     * multiple times.
     **/
    Included(): Resource[];
}

export type IncludedResources = Map<string, resource>;

export class Document<T> {
    jsonapi: Spec;
    links: ILinks;
    meta: IMeta;
    data: any;
    wdata: T;
    included: resource[];
    errors: IError[];

    constructor(data?: any) {
        if (!data) return null;

        this.jsonapi = data.jsonapi;
        if (data.links) {
            if (data.links instanceof Map) {
                this.links = data.links;
            } else {
                this.links = new Map(Object.entries(data.links));
            }
        }
        if (data.meta) {
            if (data.meta instanceof Map) {
                this.meta = data.meta;
            } else {
                this.meta = new Map(Object.entries(data.meta));
            }
        }
        if (data.data) {
            if (Array.isArray(data.data)) {
                this.data = [];
                for (const d of data.data) {
                    this.data.push(new resource(d));
                }
            } else {
                this.data = new resource(data.data);
            }
        }
        this.included = data.included ? data.included.map((i: any) => new resource(i)) : undefined;
        this.errors = data.errors;
    }

    Spec(): ISpec {
        return this.jsonapi;
    }

    Links(): ILinks {
        return this.links;
    }

    Meta(): IMeta {
        return this.meta;
    }

    Data(): T {
        return this.wdata;
    }

    Included(): Resource[] {
        if (!this.included) return null;
        return this.included.map(v => v as Resource);
    }

    Errors(): IError[] {
        return this.errors;
    }
}
