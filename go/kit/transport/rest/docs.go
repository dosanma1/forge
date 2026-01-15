package rest

import (
	"net/http"

	"github.com/swaggest/swgui/v5emb"
)

type docs struct {
	title       string
	description string
	version     string

	path string
}

type DocsOption func(*docs)

func DocsWithTitle(title string) DocsOption {
	return func(d *docs) {
		d.title = title
	}
}

func DocsWithDescription(description string) DocsOption {
	return func(d *docs) {
		d.description = description
	}
}

func DocsWithVersion(version string) DocsOption {
	return func(d *docs) {
		d.version = version
	}
}

func newDocs(path string, opts ...DocsOption) *docs {
	doc := &docs{
		path: path,
	}
	for _, opt := range opts {
		opt(doc)
	}
	return doc
}

type docsRESTCtrl struct {
	path             string
	OpenAPICollector *Collector
	hello            http.Handler
	collector        http.Handler
	docs             http.Handler
}

func NewDocsRESTCtrl(docs *docs, collector *Collector) *docsRESTCtrl {
	collector.SpecSchema().SetTitle(docs.title)
	collector.SpecSchema().SetDescription(docs.description)
	collector.SpecSchema().SetVersion(docs.version)

	return &docsRESTCtrl{
		path:      docs.path,
		collector: collector,
		docs: v5emb.New(
			docs.title,
			docs.path+"/collector/openapi.json",
			docs.path+"/",
		),
	}
}

func (c docsRESTCtrl) Version() string {
	return ""
}

func (c docsRESTCtrl) BasePath() string {
	return c.path
}

func (c docsRESTCtrl) Endpoints() []Endpoint {
	return []Endpoint{
		NewEndpoint(http.MethodGet, "/collector/openapi.json", c.collector),
		NewEndpoint(http.MethodGet, "/", c.docs),
	}
}
