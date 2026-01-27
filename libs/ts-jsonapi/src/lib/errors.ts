import { ILinks } from './links';
import { IMeta } from './meta';

/**
 * Error objects provide additional information about problems encountered
 * while performing an operation. Error objects MUST be returned as an array
 * keyed by errors in the top level of a JSON:API document.
 * An error object MAY have the following members, and MUST contain at least one of:
 *   - id
 *   - links
 *   - status
 *   - code
 *   - title
 *   - detail
 *   - source
 *   - meta
 **/
export interface IError {
    /**
     * A unique identifier for this particular occurrence of the problem.
     **/
    ID(): string;

    /**
     * A links object that MAY contain the following members:
     *    - about: a link that leads to further details about this particular
     * 			occurrence of the problem. When derefenced, this URI SHOULD return a
     * 			human-readable description of the error.
     * 		- type: a link that identifies the type of error that this
     * 			particular error is an instance of. This URI SHOULD be dereferencable to
     * 			a human-readable explanation of the general error.
     */
    Links(): ILinks;

    /**
     * The HTTP status code applicable to this problem, expressed as a string value.
     * This SHOULD be provided.
     **/
    Status(): string;

    /**
     * An application-specific error code, expressed as a string value.
     **/
    Code(): string;

    /**
     * A short, human-readable summary of the problem that SHOULD NOT change
     * from occurrence to occurrence of the problem, except for purposes of localization.
     **/
    Title(): string;

    /**
     * A human-readable explanation specific to this occurrence of the problem.
     * Like title, this field’s value can be localised.
     **/
    Detail(): string;

    /**
     * An object containing references to the primary source of the error.
     * It SHOULD include one of the following members or be omitted:
     *   - pointer
     *   - parameter
     *   - header
     **/
    Source(): ErrorSource;

    /**
     * A meta object containing non-standard meta-information about the error.
     **/
    Meta(): IMeta;
}

export interface ErrorSource {
    /**
     * A JSON Pointer [RFC6901] to the value in the request
     * document that caused the error [e.g. "/data" for a primary data object,
     * or "/data/attributes/title" for a specific attribute].
     * This MUST point to a value in the request document that exists;
     * if it doesn’t, the client SHOULD simply ignore the pointer.
     **/
    Pointer(): string;

    /**
     * A string indicating which URI query parameter caused the error
     **/
    Parameter(): string;

    /**
     * A string indicating the name of a single request header which caused the error.
     **/
    Header(): string;
}
