// Package appinsights implements a tracer.Tracer using application insights library as a backend
package appinsights

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/microsoft/ApplicationInsights-Go/appinsights"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/monitoring/tracer"
)

type contextKeyType string

const (
	defaultEndpoint         string         = "https://dc.services.visualstudio.com/v2/track"
	defaultMaxBatchSize     int            = 8192
	defaultMaxBatchInterval time.Duration  = 2 * time.Second
	contextKey              contextKeyType = "span"
)

var (
	errEmptyInstrumentationKey = errors.New("appinsight's instrumentation key must not be empty")
	errEmptyName               = errors.New("appinsight's name must not be empty")
)

type TelemetryClient appinsights.TelemetryClient

type traceID [16]byte

//nolint:gochecknoglobals // this prevents us from allocating each time we need to check if a TraceID is valid
var nilTraceID = [16]byte{}

func (t traceID) IsValid() bool {
	return !bytes.Equal(t[:], nilTraceID[:])
}

func (t traceID) MarshalJSON() ([]byte, error) {
	return json.Marshal(t.String())
}

func (t traceID) String() string {
	return hex.EncodeToString(t[:])
}

func newTraceID() tracer.ID {
	var trace [16]byte
	if _, err := rand.Read(trace[:]); err != nil {
		return traceID{}
	}
	return traceID(trace)
}

type spanID [8]byte

//nolint:gochecknoglobals // this prevents us from allocating each time we need to check if a SpanId is valid
var nilSpanID = [8]byte{}

func (t spanID) IsValid() bool {
	return !bytes.Equal(t[:], nilSpanID[:])
}

func (t spanID) MarshalJSON() ([]byte, error) {
	return json.Marshal(t.String())
}

func (t spanID) String() string {
	return hex.EncodeToString(t[:])
}

func newSpanID() tracer.ID {
	var span [8]byte
	if _, err := rand.Read(span[:]); err != nil {
		return spanID{}
	}
	return spanID(span)
}

type Tracer struct {
	client     appinsights.TelemetryClient
	propagator tracer.Propagator
	attributes map[string]string
}

type config struct {
	telemetryConfiguration *appinsights.TelemetryConfiguration
	telemetryClient        appinsights.TelemetryClient
	propagator             tracer.Propagator
	attributes             map[string]string
}

type option func(*config)

// WithMaxBatchSize sets the maximum number of telemetry items that can be submitted in each
// request.  If this many items are buffered, the buffer will be
// flushed before MaxBatchInterval expires.
func WithMaxBatchSize(maxBatchSize int) option {
	return func(config *config) {
		config.telemetryConfiguration.MaxBatchSize = maxBatchSize
	}
}

// WithMaxBatchInterval sets the maximum time to wait before sending a batch of telemetry.
func WithMaxBatchInterval(maxBatchInternal time.Duration) option {
	return func(config *config) {
		config.telemetryConfiguration.MaxBatchInterval = maxBatchInternal
	}
}

// WithEndpointURL sets the endpoint URL where data will be submitted.
func WithEndpointURL(endpoint string) option {
	return func(config *config) {
		config.telemetryConfiguration.EndpointUrl = endpoint
	}
}

// WithInstrumentationKey sets the instrumentation key for the client.
func WithInstrumentationKey(instrumentationKey string) option {
	return func(config *config) {
		config.telemetryConfiguration.InstrumentationKey = instrumentationKey
	}
}

// WithTelemetryClient sets the telemetry client. This should be used for testing only.
func WithTelemetryClient(client appinsights.TelemetryClient) option {
	return func(config *config) {
		config.telemetryClient = client
	}
}

// WithConnectionString uses the new connection string format to set both the instrumentation key and the endpoint.
func WithConnectionString(connectionString string) option {
	return func(config *config) {
		connElements := strings.Split(strings.TrimSpace(connectionString), ";")
		for _, connElement := range connElements {
			elementParts := strings.Split(connElement, "=")
			if len(elementParts) != 2 { //nolint:gomnd // it needs to be exactly two
				continue
			}
			switch strings.ToLower(elementParts[0]) {
			case "instrumentationkey":
				config.telemetryConfiguration.InstrumentationKey = elementParts[1]
			case "ingestionendpoint":
				config.telemetryConfiguration.EndpointUrl = elementParts[1] + "v2/track"
			}
		}
	}
}

// WithPropagator sets the propagation for this tracer.
func WithPropagator(propagator tracer.Propagator) option {
	return func(config *config) {
		config.propagator = propagator
	}
}

// WithGlobalAttributes sets initial fields for logger
func WithGlobalAttributes(kv ...tracer.KeyValue) option {
	return func(cfg *config) {
		for _, v := range kv {
			cfg.attributes[v.Key()] = stringValue(v.Value())
		}
	}
}

func WithServiceName(name string) option {
	return WithGlobalAttributes(tracer.NewKeyValue(fields.NameService.Merge(fields.NameName).String(), name))
}

func defaultOptions(trace tracer.Tracer, serviceName string) []option {
	return []option{
		WithEndpointURL(defaultEndpoint),
		WithMaxBatchSize(defaultMaxBatchSize),
		WithMaxBatchInterval(defaultMaxBatchInterval),
		WithServiceName(serviceName),
		WithPropagator(tracer.DefaultPropagator(trace)),
	}
}

func New(name string, opts ...option) (tracer.Tracer, error) {
	cfg := &config{
		telemetryConfiguration: &appinsights.TelemetryConfiguration{},
		attributes:             make(map[string]string),
	}

	t := &Tracer{}

	for _, opt := range append(defaultOptions(t, name), opts...) {
		opt(cfg)
	}

	if cfg.telemetryConfiguration.InstrumentationKey == "" {
		panic(errEmptyInstrumentationKey)
	}

	if cfg.attributes[fields.NameService.Merge(fields.NameName).String()] == "" {
		panic(errEmptyName)
	}

	client := cfg.telemetryClient
	if client == nil {
		client = appinsights.NewTelemetryClientFromConfig(cfg.telemetryConfiguration)
	}

	t.client = client
	t.propagator = cfg.propagator
	t.attributes = cfg.attributes

	return t, nil
}

func (a *Tracer) Propagator() tracer.Propagator {
	return a.propagator
}

func (a *Tracer) InjectParent(ctx context.Context, t, s string) context.Context {
	tID, err := hex.DecodeString(t)
	if err != nil {
		return ctx
	}
	sID, err := hex.DecodeString(s)
	if err != nil {
		return ctx
	}
	var ttID traceID
	var ssID spanID
	copy(ttID[:], tID)
	copy(ssID[:], sID)
	return context.WithValue(ctx, contextKey, tracer.NewParentSpan(ttID, ssID))
}

func (a *Tracer) Start(ctx context.Context, opts ...tracer.SpanOption) (context.Context, tracer.Span) {
	tID := newTraceID()
	sID := newSpanID()
	var parentID tracer.ID
	parentID = spanID{}

	parent := a.SpanFromContext(ctx)

	if parent.HasTraceID() {
		tID = parent.TraceID()
	}

	if parent.HasSpanID() {
		parentID = parent.SpanID()
	}

	spanConfiguration := &tracer.SpanConfiguration{
		Name:    "",
		TraceID: tID,
		SpanID:  sID,
		Kind:    tracer.SpanKindUnspecified,
	}

	for _, opt := range opts {
		opt(spanConfiguration)
	}

	properties := make(map[string]string)
	for k, v := range a.attributes {
		properties[k] = v
	}

	span := &appinsightsSpan{
		client:     a.client,
		traceID:    spanConfiguration.TraceID,
		spanID:     spanConfiguration.SpanID,
		parentID:   parentID,
		name:       spanConfiguration.Name,
		timestamp:  time.Now(),
		spanKind:   spanConfiguration.Kind,
		properties: properties,
		success:    true,
	}
	return context.WithValue(ctx, contextKey, span), span
}

func (a *Tracer) End(span tracer.Span) {
	span.End()
}

func (a *Tracer) SpanFromContext(ctx context.Context) tracer.Span {
	spanCtx := ctx.Value(contextKey)
	if spanCtx != nil {
		if span, ok := spanCtx.(tracer.Span); ok {
			return span
		}
	}
	properties := make(map[string]string)
	for k, v := range a.attributes {
		properties[k] = v
	}
	return &appinsightsSpan{
		client:     a.client,
		traceID:    traceID{},
		spanID:     spanID{},
		parentID:   spanID{},
		timestamp:  time.Now(),
		properties: properties,
	}
}
