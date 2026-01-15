package rest

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/jsonapi"
)

// StatusCoder is checked by DefaultErrorEncoder. If an error value implements
// StatusCoder, the StatusCode will be used when encoding the error. By default,
// StatusInternalServerError (500) is used.
type StatusCoder interface {
	StatusCode() int
}

// Headerer is checked by DefaultErrorEncoder. If an error value implements
// Headerer, the provided headers will be applied to the response writer, after
// the Content-Type is set.
type Headerer interface {
	Headers() http.Header
}

func DefaultErrorEncoder(_ context.Context, err error, w http.ResponseWriter) {
	contentType, body := "text/plain; charset=utf-8", []byte(err.Error())
	if marshaler, ok := err.(json.Marshaler); ok {
		if jsonBody, marshalErr := marshaler.MarshalJSON(); marshalErr == nil {
			contentType, body = "application/json; charset=utf-8", jsonBody
		}
	}
	w.Header().Set("Content-Type", contentType)
	if headerer, ok := err.(Headerer); ok {
		for k, values := range headerer.Headers() {
			for _, v := range values {
				w.Header().Add(k, v)
			}
		}
	}
	code := http.StatusInternalServerError
	if sc, ok := err.(StatusCoder); ok {
		code = sc.StatusCode()
	}
	w.WriteHeader(code)
	w.Write(body)
}

func JsonApiErrorEncoder(ctx context.Context, err error, w http.ResponseWriter) {
	// Extract HTTP status code from the error
	statusCode := http.StatusInternalServerError
	if apiErr, ok := errors.As(err); ok {
		statusCode = apiErr.HTTPStatus()
	}

	// Set headers
	w.Header().Set("Content-Type", "application/vnd.api+json")
	w.WriteHeader(statusCode)

	// Marshal the error in JSON-API format
	if marshalErr := jsonapi.MarshalErrors(w, transformError(err)); marshalErr != nil {
		// Fallback to simple error response if marshaling fails
		http.Error(w, err.Error(), statusCode)
	}
}

// transformError converts a structured error into JSON API error objects
func transformError(err error) []*jsonapi.ErrorObject {
	// Try to extract our structured error first
	if apiErr, ok := errors.As(err); ok {
		return transformStructuredError(apiErr)
	}

	// Fallback for unknown errors
	return []*jsonapi.ErrorObject{
		{
			Status: "500",
			Code:   "INTERNAL_ERROR",
			Title:  "Internal Server Error",
			Detail: err.Error(),
		},
	}
}

// transformStructuredError converts our structured error into JSON API format
func transformStructuredError(err errors.Error) []*jsonapi.ErrorObject {
	var errorObjects []*jsonapi.ErrorObject

	// For field validation errors, only return field-level errors
	if len(err.Details()) > 0 && isFieldValidationError(err) {
		// Add field-level errors as separate error objects
		for _, detail := range err.Details() {
			fieldError := &jsonapi.ErrorObject{
				Status: strconv.Itoa(err.HTTPStatus()),
				Code:   detail.Code().String(),
				Title:  getErrorTitle(detail.Code()),
				Detail: detail.Message(),
				Source: &jsonapi.ErrorSource{
					Pointer: "/data/attributes/" + detail.Field(),
				},
			}

			// Add meta information including field name and invalid value
			fieldMeta := map[string]interface{}{
				"field": detail.Field(),
			}
			if detail.Value() != nil {
				fieldMeta["invalid_value"] = detail.Value()
			}
			fieldError.Meta = &fieldMeta

			errorObjects = append(errorObjects, fieldError)
		}
		return errorObjects
	}

	// Create the main error object for non-field validation errors
	mainError := &jsonapi.ErrorObject{
		Status: strconv.Itoa(err.HTTPStatus()),
		Code:   err.Code().String(),
		Title:  getErrorTitle(err.Code()),
		Detail: err.Message(),
	}

	// Add meta information if available
	meta := make(map[string]interface{})
	if err.RequestID() != "" {
		meta["request_id"] = err.RequestID()
	}
	if err.Service() != "" {
		meta["service"] = err.Service()
	}
	// if !err.Timestamp().IsZero() {
	// 	meta["timestamp"] = err.Timestamp()
	// }
	if len(meta) > 0 {
		mainError.Meta = &meta
	}

	errorObjects = append(errorObjects, mainError)

	// Add field-level errors as separate error objects (for complex errors)
	for _, detail := range err.Details() {
		fieldError := &jsonapi.ErrorObject{
			Status: strconv.Itoa(err.HTTPStatus()),
			Code:   detail.Code().String(),
			Title:  getErrorTitle(detail.Code()),
			Detail: detail.Message(),
			Source: &jsonapi.ErrorSource{
				Pointer: "/data/attributes/" + detail.Field(),
			},
		}

		// Add meta information including field name and invalid value
		fieldMeta := map[string]interface{}{
			"field": detail.Field(),
		}
		if detail.Value() != nil {
			fieldMeta["invalid_value"] = detail.Value()
		}
		fieldError.Meta = &fieldMeta

		errorObjects = append(errorObjects, fieldError)
	}

	return errorObjects
}

// isFieldValidationError checks if this is a pure field validation error
func isFieldValidationError(err errors.Error) bool {
	code := err.Code()
	return code == errors.CodeMissingField ||
		code == errors.CodeInvalidFormat ||
		code == errors.CodeOutOfRange ||
		code == errors.CodeValidationFailed
}

// getErrorTitle returns a human-readable title for error codes
func getErrorTitle(code errors.Code) string {
	switch code {
	case errors.CodeValidationFailed:
		return "Validation Failed"
	case errors.CodeInvalidArgument:
		return "Invalid Input"
	case errors.CodeMissingField:
		return "Missing Required Field"
	case errors.CodeInvalidFormat:
		return "Invalid Format"
	case errors.CodeOutOfRange:
		return "Value Out of Range"
	case errors.CodeNotFound:
		return "Resource Not Found"
	case errors.CodeAlreadyExists:
		return "Resource Already Exists"
	case errors.CodeConflict:
		return "Conflict"
	case errors.CodeUnauthenticated:
		return "Authentication Required"
	case errors.CodeForbidden:
		return "Access Forbidden"
	case errors.CodeInternalError:
		return "Internal Server Error"
	case errors.CodeServiceUnavailable:
		return "Service Unavailable"
	case errors.CodeTimeout:
		return "Request Timeout"
	case errors.CodeRateLimited:
		return "Too Many Requests"
	default:
		return "Error"
	}
}
