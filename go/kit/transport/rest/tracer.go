package rest

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer/carrier"
)

var (
	//nolint:gochecknoglobals // we want the slice to be global for efficiency purposes
	allowedHTTPReqHeaders = []string{
		"Accept", "Accept-Language", "Accept-Encoding",
		"Content-Type", "Content-Encoding", "Content-Length",
		"Origin",
	}
	//nolint:gochecknoglobals // we want the slice to be global for efficiency purposes
	allowedHTTPResHeaders = []string{
		"Content-Type", "Content-Language", "Content-Encoding", "Content-Length",
		"Location",
	}
)

type loggingResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (lrw *loggingResponseWriter) WriteHeader(code int) {
	lrw.statusCode = code
	lrw.ResponseWriter.WriteHeader(code)
}

func fullURL(r *http.Request) *url.URL {
	if r.Header.Get("X-Forwarded-Proto") == "" || r.Header.Get("X-Forwarded-Host") == "" {
		return r.URL
	}

	u, err := url.Parse(fmt.Sprintf("%s://%s%s", r.Header.Get("X-Forwarded-Proto"), r.Header.Get("X-Forwarded-Host"), r.URL.Path))
	if err != nil {
		return r.URL
	}
	return u
}

func normalizedHeaderName(headerName string) string {
	return strings.ReplaceAll(
		strings.ToLower(headerName),
		"-", "_",
	)
}

func requestHeaderAttrName(headerName string) string {
	return "http.request.header." + normalizedHeaderName(headerName)
}

func responseHeaderAttrName(headerName string) string {
	return "http.response.header." + normalizedHeaderName(headerName)
}

func requestHeaderAttr(r *http.Request, headerName string) tracer.KeyValue {
	val := r.Header.Get(headerName)
	if len(val) < 1 {
		return nil
	}

	return tracer.NewKeyValue(requestHeaderAttrName(headerName), val)
}

func responseHeaderAttr(ww http.ResponseWriter, headerName string) tracer.KeyValue {
	val := ww.Header().Get(headerName)
	if len(val) < 1 {
		return nil
	}

	return tracer.NewKeyValue(responseHeaderAttrName(headerName), val)
}

func requestHeaderAttrs(r *http.Request) []tracer.KeyValue {
	headerAttrs := []tracer.KeyValue{}
	for _, headerName := range allowedHTTPReqHeaders {
		attr := requestHeaderAttr(r, headerName)
		if attr != nil {
			headerAttrs = append(headerAttrs, attr)
		}
	}

	return headerAttrs
}

func responseHeaderAttrs(ww http.ResponseWriter) []tracer.KeyValue {
	headerAttrs := []tracer.KeyValue{}
	for _, headerName := range allowedHTTPResHeaders {
		attr := responseHeaderAttr(ww, headerName)
		if attr != nil {
			headerAttrs = append(headerAttrs, attr)
		}
	}

	return headerAttrs
}

// RESTTraceMiddleware returns a Middleware that extracts the active span data (if it exists) from the request
// and creates a new span tagging it with all the request information.
func RESTTraceMiddleware(trace tracer.Tracer) Middleware {
	if trace == nil {
		panic("http tracer middleware error")
	}

	return MiddlewareFunc(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, span := trace.Start(
				trace.Propagator().Extract(r.Context(), carrier.NewHTTPHeaderTextMapCarrier(r.Header)),
				tracer.WithName(r.URL.Path),
				tracer.WithSpanKind(tracer.SpanKindServer),
			)
			defer trace.End(span)

			r = r.WithContext(ctx)

			xForwardedFor := r.Header.Get("X-Forwarded-For")
			if xForwardedFor == "" {
				xForwardedFor = r.RemoteAddr
			}

			u := fullURL(r)

			span.SetAttributes(
				tracer.NewKeyValue("http.method", r.Method),
				tracer.NewKeyValue("http.flavor", r.Proto),
				tracer.NewKeyValue("http.target", u.RequestURI()),
				tracer.NewKeyValue("http.host", u.Host),
				tracer.NewKeyValue("http.server_name", u.Hostname()),
				tracer.NewKeyValue("net.host.port", u.Port()),
				tracer.NewKeyValue("http.scheme", u.Scheme),
				tracer.NewKeyValue("http.user_agent", r.UserAgent()),
				tracer.NewKeyValue("http.route", u.Path),
				tracer.NewKeyValue("http.client_ip", xForwardedFor),
				tracer.NewKeyValue("net.peer.ip", r.RemoteAddr),
			)

			span.SetAttributes(requestHeaderAttrs(r)...)

			ww := &loggingResponseWriter{
				ResponseWriter: w,
			}

			next.ServeHTTP(ww, r)

			span.SetAttributes(
				append(
					responseHeaderAttrs(ww),
					tracer.NewKeyValue("http.status_code", ww.statusCode),
				)...,
			)

			switch {
			case ww.statusCode >= http.StatusInternalServerError: /*5XX*/
				span.SetErrorStatus(strconv.Itoa(ww.statusCode)) // TODO maybe read the body?
				// https://linear.app/messagemycustomer/issue/MMC-146/[general]-tracer-improvements
			case ww.statusCode >= http.StatusBadRequest: /*4XX*/
				// Leave it unset
			case ww.statusCode >= http.StatusMultipleChoices: /*3XX*/
				// Leave it unset
			case ww.statusCode >= http.StatusOK: /*2XX*/
				span.SetOkStatus("")
			default: /*1XX*/
				// Leave it unset
			}
		})
	})
}

func clientRequestTracer(clientName string, trace tracer.Tracer) ClientRequestInterceptor {
	return func(ctx context.Context, r *http.Request) context.Context {
		//nolint: staticcheck //false positive, r cannot be nil at this stage if it's we should panic
		reqURL := *r.URL
		if reqURL.User != nil {
			reqURL.User = nil
		}
		//nolint: staticcheck //false positive, r cannot be nil at this stage if it's we should panic
		method, endURL := r.Method, reqURL.String()
		newCtx, span := trace.Start(
			ctx,
			tracer.WithName(fmt.Sprintf("%s -> %s %s", clientName, method, endURL)),
			tracer.WithSpanKind(tracer.SpanKindClient),
		)

		//nolint: staticcheck //false positive, r cannot be nil at this stage if it's we should panic
		if r != nil && r.Header != nil {
			trace.Propagator().Inject(newCtx, carrier.NewHTTPHeaderTextMapCarrier(r.Header))
		}

		span.SetAttributes(
			tracer.NewKeyValue("http.method", method),
			tracer.NewKeyValue("http.flavor", r.Proto),
			tracer.NewKeyValue("http.user_agent", r.UserAgent()),
			tracer.NewKeyValue("http.request_content_length", r.ContentLength),
			tracer.NewKeyValue("http.url", endURL),
			tracer.NewKeyValue("net.peer.name", reqURL.Host),
			tracer.NewKeyValue("net.peer.port", reqURL.Port()),
		)

		return newCtx
	}
}

func clientResponseTracer(trace tracer.Tracer) ClientResponseInterceptor {
	return func(ctx context.Context, r *http.Response) context.Context {
		span := trace.SpanFromContext(ctx)

		span.SetAttributes(
			tracer.NewKeyValue("http.status_code", r.StatusCode),
		)

		switch {
		case r.StatusCode >= http.StatusInternalServerError: /*5XX*/
			span.SetErrorStatus(strconv.Itoa(r.StatusCode))
		case r.StatusCode >= http.StatusBadRequest: /*4XX*/
			span.SetErrorStatus(strconv.Itoa(r.StatusCode))
		case r.StatusCode >= http.StatusMultipleChoices: /*3XX*/
			// Leave it unset
		case r.StatusCode >= http.StatusOK: /*2XX*/
			span.SetOkStatus("")
		default: /*1XX*/
			// Leave it unset
		}

		return ctx
	}
}

func clientCallEndTracer(trace tracer.Tracer) ClientErrorInterceptor {
	return func(ctx context.Context, err error) {
		span := trace.SpanFromContext(ctx)
		defer span.End()

		if err != nil {
			span.SetErrorStatus(err.Error())
		}
	}
}
