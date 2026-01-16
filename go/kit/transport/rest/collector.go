// Package openapi provides documentation collector.
package rest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"reflect"
	"sync"

	"github.com/swaggest/jsonschema-go"
	"github.com/swaggest/openapi-go"
	"github.com/swaggest/openapi-go/openapi3"
)

// OpenAPIPreparer defines http.Handler with OpenAPI information.
type OpenAPIPreparer interface {
	SetupOpenAPIOperation(oc openapi.OperationContext) error
}

type preparerFunc func(oc openapi.OperationContext) error

// Collector extracts OpenAPI documentation from HTTP handler and underlying use case interactor.
type Collector struct {
	mu sync.Mutex

	BasePath string // URL path to docs, default "/docs".

	// CombineErrors can take a value of "oneOf" or "anyOf",
	// if not empty it enables logical schema grouping in case
	// of multiple responses with same HTTP status code.
	CombineErrors string

	// DefaultSuccessResponseContentType is a default success response content type.
	// If empty, "application/json" is used.
	DefaultSuccessResponseContentType string

	// DefaultErrorResponseContentType is a default error response content type.
	// If empty, "application/json" is used.
	DefaultErrorResponseContentType string

	gen *openapi3.Reflector
	ref openapi.Reflector

	ocAnnotations map[string][]func(oc openapi.OperationContext) error
	annotations   map[string][]func(*openapi3.Operation) error
	operationIDs  map[string]bool

	// DefaultMethods list is used when handler serves all methods.
	DefaultMethods []string

	// OperationExtractor allows flexible extraction of OpenAPI information.
	OperationExtractor func(h http.Handler) func(oc openapi.OperationContext) error

	// Host filters routes by host, gorilla/mux can serve different handlers at
	// same method, paths with different hosts. This can not be expressed with a single
	// OpenAPI document.
	Host string
}

// NewCollector creates an instance of OpenAPI Collector.
func NewCollector(r openapi.Reflector) *Collector {
	c := &Collector{
		ref: r,
		DefaultMethods: []string{
			http.MethodHead, http.MethodGet, http.MethodPost,
			http.MethodPut, http.MethodPatch, http.MethodDelete,
		},
	}

	if r3, ok := r.(*openapi3.Reflector); ok {
		c.gen = r3
	}

	return c
}

// SpecSchema returns OpenAPI specification schema.
func (c *Collector) SpecSchema() openapi.SpecSchema {
	return c.Refl().SpecSchema()
}

// Refl returns OpenAPI reflector.
func (c *Collector) Refl() openapi.Reflector {
	if c.ref != nil {
		return c.ref
	}

	return c.Reflector()
}

// Reflector is an accessor to OpenAPI Reflector instance.
func (c *Collector) Reflector() *openapi3.Reflector {
	if c.ref != nil && c.gen == nil {
		panic(fmt.Sprintf("conflicting OpenAPI reflector supplied: %T", c.ref))
	}

	if c.gen == nil {
		c.gen = openapi3.NewReflector()
	}

	return c.gen
}

// AnnotateOperation adds OpenAPI operation configuration that is applied during collection,
// method can be empty to indicate any method.
func (c *Collector) AnnotateOperation(method, pattern string, setup ...func(oc openapi.OperationContext) error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.ocAnnotations == nil {
		c.ocAnnotations = make(map[string][]func(oc openapi.OperationContext) error)
	}

	c.ocAnnotations[method+pattern] = append(c.ocAnnotations[method+pattern], setup...)
}

// HasAnnotation indicates if there is at least one annotation registered for this operation.
func (c *Collector) HasAnnotation(method, pattern string) bool {
	if len(c.ocAnnotations[method+pattern]) > 0 {
		return true
	}

	return len(c.ocAnnotations[pattern]) > 0
}

// CollectOperation prepares and adds OpenAPI operation.
func (c *Collector) CollectOperation(
	method, pattern string,
	annotations ...func(oc openapi.OperationContext) error,
) (err error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	defer func() {
		if err != nil {
			err = fmt.Errorf("failed to reflect API schema for %s %s: %w", method, pattern, err)
		}
	}()

	reflector := c.Refl()

	oc, err := reflector.NewOperationContext(method, pattern)
	if err != nil {
		return err
	}

	for _, setup := range c.ocAnnotations[pattern] {
		if err = setup(oc); err != nil {
			return err
		}
	}

	for _, setup := range c.ocAnnotations[method+pattern] {
		if err = setup(oc); err != nil {
			return err
		}
	}

	for _, setup := range annotations {
		if err = setup(oc); err != nil {
			return err
		}
	}

	return reflector.AddOperation(oc)
}

func (c *Collector) collect(method, path string, preparer func(oc openapi.OperationContext) error) preparerFunc {
	return func(oc openapi.OperationContext) error {
		// Do not apply default parameters to not conflict with custom preparer.
		if preparer != nil {
			err := preparer(oc)
			if err != nil {
				return err
			}
			// c.combineOCErrors(oc, []int{http.StatusInternalServerError}, map[int][]interface{})
			return nil
		}

		// Do not apply default parameters to not conflict with custom annotation.
		if c.HasAnnotation(method, path) {
			return nil
		}

		_, _, pathItems, err := openapi.SanitizeMethodPath(method, path)
		if err != nil {
			return err
		}

		if len(pathItems) > 0 {
			req := jsonschema.Struct{}
			for _, p := range pathItems {
				req.Fields = append(req.Fields, jsonschema.Field{
					Name:  "F" + p,
					Tag:   reflect.StructTag(`path:"` + p + `"`),
					Value: "",
				})
			}

			oc.AddReqStructure(req)
		}

		oc.SetDescription("Information about this operation was obtained using only HTTP method and path pattern. " +
			"It may be incomplete and/or inaccurate.")
		oc.SetTags("Incomplete")
		oc.AddRespStructure(nil, func(cu *openapi.ContentUnit) {
			cu.ContentType = "text/html"
		})

		return nil
	}
}

func (c *Collector) setOCJSONResponse(oc openapi.OperationContext, output interface{}, statusCode int) {
	oc.AddRespStructure(output, func(cu *openapi.ContentUnit) {
		cu.HTTPStatus = statusCode

		if described, ok := output.(jsonschema.Described); ok {
			cu.Description = described.Description()
		}

		if output != nil {
			cu.ContentType = c.DefaultErrorResponseContentType
		}
	})
}

func (c *Collector) combineOCErrors(oc openapi.OperationContext, statusCodes []int, errsByCode map[int][]interface{}) {
	for _, statusCode := range statusCodes {
		errResps := errsByCode[statusCode]

		if len(errResps) == 1 || c.CombineErrors == "" {
			c.setOCJSONResponse(oc, errResps[0], statusCode)
		} else {
			switch c.CombineErrors {
			case "oneOf":
				c.setOCJSONResponse(oc, jsonschema.OneOf(errResps...), statusCode)
			case "anyOf":
				c.setOCJSONResponse(oc, jsonschema.AnyOf(errResps...), statusCode)
			default:
				panic("oneOf/anyOf expected for openapi.Collector.CombineErrors, " +
					c.CombineErrors + " received")
			}
		}
	}
}

func (c *Collector) ServeHTTP(rw http.ResponseWriter, _ *http.Request) {
	c.mu.Lock()
	defer c.mu.Unlock()

	schema := c.SpecSchema()
	document, err := json.MarshalIndent(schema, "", " ")
	if err != nil {
		http.Error(rw, err.Error(), http.StatusInternalServerError)
	}

	rw.Header().Set("Content-Type", "application/json")

	_, err = rw.Write(document)
	if err != nil {
		http.Error(rw, err.Error(), http.StatusInternalServerError)
	}
}
