package rest

import (
	"net/http"

	"github.com/dosanma1/forge/go/kit/transport"
)

type (
	HandlerOpt    func(c *handlerConfig)
	handlerConfig struct {
		allowsEmptyReq bool
		opts           []serverOption
		errorEncoder   ErrorEncoder
		getDecoderOpts []getDecoderOpt
	}
)

func defaultHandlerOpts() []HandlerOpt {
	return []HandlerOpt{
		HandlerAllowsEmptyReq(false),
		HandlerWithErrorEncoder(DefaultErrorEncoder),
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

type handler[I, O any] struct {
	e          transport.Endpoint[I, O]
	reqDecoder DecodeRequestFunc
	resEncoder EncodeResponseFunc

	allowsEmptyReq bool
	opts           []serverOption
	errorEncoder   ErrorEncoder
}

func (h handler[I, O]) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	request, err := h.reqDecoder(ctx, r)
	if err != nil {
		h.errorEncoder(ctx, err, w)
		return
	}

	if request == nil {
		if !h.allowsEmptyReq {
			h.errorEncoder(ctx, http.ErrBodyNotAllowed, w)
			return
		}
	}

	var in I
	if request != nil {
		var ok bool
		in, ok = request.(I)
		if !ok {
			h.errorEncoder(ctx, http.ErrBodyNotAllowed, w)
			return
		}
	}

	response, err := h.e(r.Context(), in)
	if err != nil {
		h.errorEncoder(ctx, err, w)
		return
	}

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
	}
}
