package rest

import (
	"net/http"

	"github.com/dosanma1/forge/go/kit/application/ctrl"
	"github.com/dosanma1/forge/go/kit/application/repository"
	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/search/query"
	"github.com/dosanma1/forge/go/kit/transport"
)

func NewResourceHandler[R resource.Resource, O any](
	e transport.Endpoint[R, R],
	decoder func(O) R, encoder func(res R) O,
	successCode int, opts ...HandlerOpt,
) http.Handler {
	return NewHandler(
		e,
		NewHTTPDecoder(decodeResourceReq(decoder)),
		RestJSONEncoder(encoder, successCode),
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
		RestJSONEncoder(encoder, http.StatusCreated),
		opts...,
	)
}

func NewListHandler[R resource.Resource, C ctrl.Lister[R], O any](
	lister C, resItemMapper func(res R) O, opts ...HandlerOpt,
) http.Handler {
	return NewHandler(
		lister.List,
		NewHTTPDecoder(QueryOptsFromReq()),
		RestJSONEncoder(
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
		RestJSONEncoder(encoder, http.StatusOK),
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
		RestJSONEncoder(encoder, http.StatusOK),
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
		RestJSONEncoder(encoder, http.StatusOK),
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
