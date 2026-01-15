package rest

import (
	"net/http"

	"github.com/dosanma1/forge/go/kit/application/ctrl"
	"github.com/dosanma1/forge/go/kit/application/repository"
	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/search/query"
	"github.com/dosanma1/forge/go/kit/transport"
	"github.com/swaggest/openapi-go"
)

type (
	HandlerOpt    func(c *handlerConfig)
	handlerConfig struct {
		allowsEmptyReq bool
		opts           []serverOption
		// errEncoder           httptransport.ErrorEncoder
		errorEncoder   ErrorEncoder
		queryParseOpts []query.ParseOpt
		doc            handlerDocumentation
		getDecoderOpts []getDecoderOpt
	}
)

func defaultHandlerOpts() []HandlerOpt {
	return []HandlerOpt{
		HandlerAllowsEmptyReq(false),
		HandlerWithErrorEncoder(JsonApiErrorEncoder),
	}
}

func HandlerAllowsEmptyReq(emptyReqAllowed bool) HandlerOpt {
	return func(c *handlerConfig) {
		c.allowsEmptyReq = emptyReqAllowed
	}
}

func HandlerWithErrorEncoder(ee ErrorEncoder) HandlerOpt {
	return func(c *handlerConfig) {
		c.errorEncoder = ee
	}
}

func HandlerWithQueryParseOpts(opts ...query.ParseOpt) HandlerOpt {
	return func(c *handlerConfig) {
		c.queryParseOpts = append(c.queryParseOpts, opts...)
	}
}

func HandlerWithGetDecoderOpts(opts ...getDecoderOpt) HandlerOpt {
	return func(c *handlerConfig) {
		c.getDecoderOpts = append(c.getDecoderOpts, opts...)
	}
}

func HandlerWithDocumentation(doc handlerDocumentation) HandlerOpt {
	return func(c *handlerConfig) {
		c.doc = doc
	}
}

type handler[I, O any] struct {
	e          transport.Endpoint[I, O]
	reqDecoder DecodeRequestFunc
	resEncoder EncodeResponseFunc

	allowsEmptyReq bool
	opts           []serverOption
	// errEncoder           httptransport.ErrorEncoder
	errorEncoder   ErrorEncoder
	queryParseOpts []query.ParseOpt

	doc handlerDocumentation
}

type handlerDocumentation struct {
	tags           []string
	summary        string
	description    string
	filters        []fields.Name
	pagination     bool
	reqStructure   interface{}
	respStructure  interface{}
	expectedErrors []error
	isDeprecated   bool
}

type handlerDocumentationOption func(*handlerDocumentation)

func HandlerDocumentationWithTags(tags ...string) handlerDocumentationOption {
	return func(hd *handlerDocumentation) {
		hd.tags = tags
	}
}

func HandlerDocumentationWithSummary(summary string) handlerDocumentationOption {
	return func(hd *handlerDocumentation) {
		hd.summary = summary
	}
}

func HandlerDocumentationWithDescription(description string) handlerDocumentationOption {
	return func(hd *handlerDocumentation) {
		hd.description = description
	}
}

//	func HandlerDocumentationWithFilters(filters map[fields.Name]filter.Operator) handlerDocumentationOption {
//		return func(hd *handlerDocumentation) {
//			for fName, v := range filters {
//				filter := fmt.Sprintf("filter[%s]", fName.String())
//				if v.Valid() {
//					filter = fmt.Sprintf("%s[%s]", filter, query.OperatorStrings[v])
//				}
//				hd.filters = append(hd.filters, filter)
//			}
//		}
//	}
func HandlerDocumentationWithFilters(filters ...fields.Name) handlerDocumentationOption {
	return func(hd *handlerDocumentation) {
		hd.filters = append(hd.filters, filters...)
	}
}

func HandlerDocumentationWithRequest(req interface{}) handlerDocumentationOption {
	return func(hd *handlerDocumentation) {
		hd.reqStructure = req
	}
}

func HandlerDocumentationWithResponse(res interface{}) handlerDocumentationOption {
	return func(hd *handlerDocumentation) {
		hd.respStructure = res
	}
}

func HandlerDocumentationWithExpectedErrors(expectedErrors ...error) handlerDocumentationOption {
	return func(hd *handlerDocumentation) {
		hd.expectedErrors = append(hd.expectedErrors, expectedErrors...)
	}
}

func NewHandlerDocumentation(opts ...handlerDocumentationOption) handlerDocumentation {
	doc := &handlerDocumentation{}
	for _, opt := range opts {
		opt(doc)
	}
	return *doc
}

func (h handler[I, O]) SetupOpenAPIOperation(oc openapi.OperationContext) error {
	oc.SetTags(h.doc.tags...)
	oc.SetSummary(h.doc.summary)
	oc.SetDescription(h.doc.description)

	oc.AddReqStructure(h.doc.reqStructure)
	oc.AddRespStructure(h.doc.respStructure)

	// for _, err := range h.doc.expectedErrors {
	// 	oc.AddRespStructure(nil, openapi.WithContentType("application/json"), openapi.WithHTTPStatus(err))
	// }

	return nil
}

func (h handler[I, O]) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	request, err := h.reqDecoder(ctx, r)
	if err != nil {
		h.errorEncoder(ctx, err, w)
		return
	}

	// ----
	if request == nil {
		if h.allowsEmptyReq {
			return
		}
		h.errorEncoder(ctx, err, w)
		return
	}
	in, ok := request.(I)
	if !ok {
		// http.Error(w, fields.NewErrInvalidType(fields.NameRequest, new(I), request).Error(), http.StatusBadRequest)
		h.errorEncoder(ctx, err, w)
		return
	}
	response, err := h.e(r.Context(), in)
	if err != nil {
		h.errorEncoder(ctx, err, w)
		return
	}
	// ----

	if err := h.resEncoder(ctx, w, response); err != nil {
		h.errorEncoder(ctx, err, w)
		return
	}
}

func NewHandler[I, O any](
	e transport.Endpoint[I, O],
	reqDecoder DecodeRequestFunc,
	resEncoder EncodeResponseFunc,
	opts ...HandlerOpt,
) handler[I, O] {
	c := new(handlerConfig)
	for _, opt := range append(defaultHandlerOpts(), opts...) {
		opt(c)
	}

	return handler[I, O]{
		e:              e,
		reqDecoder:     reqDecoder,
		resEncoder:     resEncoder,
		allowsEmptyReq: c.allowsEmptyReq,
		opts:           c.opts,
		errorEncoder:   c.errorEncoder,
		queryParseOpts: c.queryParseOpts,
		doc:            c.doc,
	}

}

func NewResourceHandler[R resource.Resource, O any](
	e transport.Endpoint[R, R],
	decoder func(O) R, encoder func(res R) O,
	successCode int, opts ...HandlerOpt,
) http.Handler {
	return NewHandler(
		e,
		NewHTTPDecoder(decodeResourceReq(decoder)),
		restJSONEncoder(encoder, successCode),
		opts...,
	)
}

func NewCreateHandler[R resource.Resource, C ctrl.Creator[R], O any](
	creator C,
	decoder func(O) R, encoder func(res R) O,
	opts ...HandlerOpt,
) http.Handler {
	return NewHandler(
		creator.Create,
		NewHTTPDecoder(decodeResourceReq(decoder)),
		restJSONEncoder(encoder, http.StatusCreated),
		opts...,
	)
}

func NewListHandler[R resource.Resource, C ctrl.Lister[R], O any](
	lister C, resItemMapper func(res R) O, opts ...HandlerOpt,
) http.Handler {
	return NewHandler(
		lister.List,
		NewHTTPDecoder(QueryOptsFromReq()),
		restJSONEncoder(
			resource.ListResponseToDTO(resItemMapper),
			http.StatusOK,
		),
		opts...,
	)
}

func NewGetHandler[R resource.Resource, C ctrl.Getter[R], O any](
	getter C, encoder func(res R) O,
	parseOpts []query.ParseOpt,
	opts ...HandlerOpt,
) http.Handler {
	cfg := new(handlerConfig)
	for _, opt := range opts {
		opt(cfg)
	}

	parseOpts = append(parseOpts, query.SkipDefaultPagination())
	return NewHandler(
		getter.Get,
		NewHTTPDecoder(DecodeGetReq(parseOpts, cfg.getDecoderOpts...)),
		restJSONEncoder(encoder, http.StatusOK),
		opts...,
	)
}

func NewUpdateHandler[R resource.Resource, C ctrl.Updater[R], O any](
	updater C,
	decoder func(O) R, encoder func(res R) O,
	opts ...HandlerOpt,
) http.Handler {
	return NewHandler(
		updater.Update,
		NewHTTPDecoder(decodeResourceReq(decoder)),
		restJSONEncoder(encoder, http.StatusOK),
		opts...,
	)
}

func NewPatchHandler[T, R resource.Resource, C ctrl.Patcher[R], O any](
	patcher C, kind resource.Type,
	decoder func(T) []repository.PatchOption, encoder func(res R) O,
	opts ...HandlerOpt,
) http.Handler {
	return NewHandler(
		patcher.Patch,
		NewHTTPDecoder(decodePatchReq(kind, decoder)),
		restJSONEncoder(encoder, http.StatusOK),
		opts...,
	)
}

func NewDeleteHandler[C ctrl.Deleter](
	deleter C, opts ...HandlerOpt,
) http.Handler {
	return NewHandler(
		deleter.Delete,
		NewHTTPDecoder(DecodeGetReq([]query.ParseOpt{})),
		NewEmptyHTTPEncoder(http.StatusNoContent),
		opts...,
	)
}
