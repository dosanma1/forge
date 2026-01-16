package rest

import (
	"context"
	"net/http"

	"github.com/dosanma1/forge/go/kit/application/ctrl"
	"github.com/dosanma1/forge/go/kit/application/repository"
	"github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/jsonapi"
	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/search/query"
)

func NewJsonApiCreateHandler[R, DTO resource.Resource, C ctrl.Creator[R]](
	creator C,
	decoder func(DTO) R, encoder func(res R) DTO,
	opts ...HandlerOpt,
) http.Handler {
	return WithJSONAPIIncludes(
		NewHandler(
			creator.Create,
			NewHTTPDecoder(jsonApiDecodeResourceReq(decoder)),
			jsonApiEncoder(encoder, http.StatusCreated),
			opts...,
		),
	)
}

func NewJsonApiListHandler[R, DTO resource.Resource, C ctrl.Lister[R]](
	lister C, resItemMapper func(res R) DTO, opts ...HandlerOpt,
) http.Handler {
	// Create a wrapper that returns jsonapi.ListResponse[DTO] interface
	listResponseMapper := func(res resource.ListResponse[R]) jsonapi.ListResponse[DTO] {
		return resource.ListResponseToDTO(resItemMapper)(res)
	}

	return WithJSONAPIIncludes(
		NewHandler(
			lister.List,
			NewHTTPDecoder(QueryOptsFromReq()),
			jsonApiListEncoder(
				listResponseMapper,
				http.StatusOK,
			),
			opts...,
		),
	)
}

func NewJsonApiGetHandler[R, DTO resource.Resource, C ctrl.Getter[R]](
	getter C, encoder func(res R) DTO,
	parseOpts []query.ParseOpt,
	opts ...HandlerOpt,
) http.Handler {
	cfg := new(handlerConfig)
	for _, opt := range opts {
		opt(cfg)
	}

	parseOpts = append(parseOpts, query.SkipDefaultPagination())
	return WithJSONAPIIncludes(
		NewHandler(
			getter.Get,
			NewHTTPDecoder(DecodeGetReq(parseOpts, cfg.getDecoderOpts...)),
			jsonApiEncoder(encoder, http.StatusOK),
			opts...,
		),
	)
}

func NewJsonApiUpdateHandler[R, DTO resource.Resource, C ctrl.Updater[R]](
	updater C,
	decoder func(DTO) R, encoder func(res R) DTO,
	opts ...HandlerOpt,
) http.Handler {
	return NewHandler(
		updater.Update,
		NewHTTPDecoder(jsonApiDecodeResourceReq(decoder)),
		jsonApiEncoder(encoder, http.StatusOK),
		opts...,
	)
}

func NewJsonApiPatchHandler[T, R, DTO resource.Resource, C ctrl.Patcher[R]](
	patcher C, kind resource.Type,
	decoder func(T) []repository.PatchOption, encoder func(res R) DTO,
	opts ...HandlerOpt,
) http.Handler {
	return WithJSONAPIIncludes(
		NewHandler(
			patcher.Patch,
			NewHTTPDecoder(jsonApiDecodePatchReq(kind, decoder)),
			jsonApiEncoder(encoder, http.StatusOK),
			opts...,
		),
	)
}

func NewJsonApiDeleteHandler[C ctrl.Deleter](
	deleter C, opts ...HandlerOpt,
) http.Handler {
	return WithJSONAPIIncludes(
		NewHandler(
			deleter.Delete,
			NewHTTPDecoder(DecodeGetReq([]query.ParseOpt{query.SkipDefaultPagination()})),
			NewEmptyHTTPEncoder(http.StatusNoContent),
			opts...,
		),
	)
}

func jsonApiEncoder[I, O any](
	itemMapper func(in I) O,
	successCode int,
) func(context.Context, http.ResponseWriter, any) error {
	return newHTTPEncoderWithContentType(
		"application/vnd.api+json; charset=utf-8",
		func(ctx context.Context, w http.ResponseWriter, in I) error {
			w.WriteHeader(successCode)

			return jsonapi.MarshalPayload(w, itemMapper(in), jsonapi.WithInclude(GetJSONAPIIncludes(ctx)...))
		},
	)
}

func jsonApiListEncoder[I, O any](
	itemMapper func(in I) jsonapi.ListResponse[O],
	successCode int,
) func(context.Context, http.ResponseWriter, any) error {
	return newHTTPEncoderWithContentType(
		"application/vnd.api+json; charset=utf-8",
		func(ctx context.Context, w http.ResponseWriter, in I) error {
			w.WriteHeader(successCode)

			return jsonapi.MarshalManyPayloads(w, itemMapper(in), jsonapi.WithInclude(GetJSONAPIIncludes(ctx)...))
		},
	)
}

func jsonApiDecodeResourceReq[R, DTO resource.Resource](mapper func(DTO) R) func(_ context.Context, req *http.Request) (R, error) {
	return func(_ context.Context, req *http.Request) (R, error) {
		res, err := jsonapi.UnmarshalPayload[DTO](req.Body)
		if err != nil {
			var zero R
			return zero, errors.InvalidArgument("invalid request body")
		}

		return mapper(res.Data), nil
	}
}

func jsonApiDecodePatchReq[T resource.Resource](
	kind resource.Type,
	mapper func(T) []repository.PatchOption,
) func(_ context.Context, req *http.Request) ([]repository.PatchOption, error) {
	return func(_ context.Context, req *http.Request) ([]repository.PatchOption, error) {

		res, err := jsonapi.UnmarshalPayload[T](req.Body)
		if err != nil {
			return nil, errors.InvalidArgument("invalid request body")
		}

		if err := validateUpdateReqData(kind, res.Data); err != nil {
			return nil, err
		}

		if pathID := req.PathValue("id"); res.Data.ID() != pathID {
			return nil, errors.InvalidArgument("request ID mismatch")
		}

		return mapper(res.Data), nil
	}
}
