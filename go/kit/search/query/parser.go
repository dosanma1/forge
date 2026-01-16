package query

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	kiterrors "github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/filter"
)

const (
	defaultPagLimit  = 3
	defaultPagOffset = 0

	filterSplits = 3
)

var (
	ErrInvalidFilterFormat = errors.New("filter format should be filter[field][operator]")
	ErrInvalidOperator     = errors.New("invalid operator")

	//nolint:gochecknoglobals // map is used in every GET request with filters, it's more efficient to keep it global
	Operators = map[string]filter.Operator{
		"eq":       filter.OpEq,
		"ne":       filter.OpNEq,
		"gt":       filter.OpGT,
		"gte":      filter.OpGTEq,
		"lt":       filter.OpLT,
		"lte":      filter.OpLTEq,
		"in":       filter.OpIn,
		"not-in":   filter.OpNotIn,
		"is":       filter.OpIs,
		"is-not":   filter.OpIsNot,
		"like":     filter.OpLike,
		"btw":      filter.OpBetween,
		"any":      filter.OpContains,
		"any-like": filter.OpContainsLike,
	}

	//nolint:gochecknoglobals // map is used in every GET request with filters, it's more efficient to keep it global
	OperatorStrings = map[filter.Operator]string{
		filter.OpEq:           "eq",
		filter.OpNEq:          "ne",
		filter.OpGT:           "gt",
		filter.OpGTEq:         "gte",
		filter.OpLT:           "lt",
		filter.OpLTEq:         "lte",
		filter.OpIn:           "in",
		filter.OpNotIn:        "not-in",
		filter.OpIs:           "is",
		filter.OpIsNot:        "is-not",
		filter.OpLike:         "like",
		filter.OpBetween:      "btw",
		filter.OpContains:     "any",
		filter.OpContainsLike: "any-like",
	}
)

func ParseOperator(val string) filter.Operator {
	v, ok := Operators[val]
	if !ok {
		return filter.OpUndefined
	}
	return v
}

func MarshalOperator(op filter.Operator) string {
	return OperatorStrings[op]
}

func parseFilter(filterKey string) (string, filter.Operator, error) {
	split := strings.Split(filterKey, "[")
	if len(split) != filterSplits {
		return "", filter.OpUndefined, kiterrors.InvalidArgument(fmt.Sprintf("invalid filter format: %s", filterKey))
	}

	fName := strings.ReplaceAll(split[1], "]", "")
	op := ParseOperator(strings.ReplaceAll(split[2], "]", ""))
	if op == filter.OpUndefined {
		return "", filter.OpUndefined, kiterrors.InvalidArgument(fmt.Sprintf("invalid operator: %s", split[2]))
	}

	return fName, op, nil
}

func parseValue(op filter.Operator, val []string) any {
	if len(val) == 1 {

		if strings.ToLower(val[0]) == "null" {
			return nil
		}

		match, err := regexp.MatchString("^(?i)(true|false)$", val[0])
		if err != nil {
			return val[0]
		}
		if match {
			if b, err := strconv.ParseBool(val[0]); err == nil {
				return b
			}
		}
		if strings.Contains(val[0], ",") {
			return strings.Split(val[0], ",")
		} else if op == filter.OpIn || op == filter.OpContainsLike {
			return []string{val[0]}
		}
		return val[0]
	}
	return val
}

func searchFromURL(uri *url.URL) ([]Option, error) {
	opts := []Option{}
	for key, values := range uri.Query() {
		if strings.Contains(key, "filter") {
			fName, op, err := parseFilter(key)
			if err != nil {
				return nil, err
			}
			opts = append(opts, FilterBy(op, fName, parseValue(op, values)))
		}
	}

	return opts, nil
}

func paginationFromURL(uri *url.URL, defaultIfEmpty bool) (opt Option, err error) {
	limit, offset := defaultPagLimit, defaultPagOffset
	l := uri.Query().Get("page[limit]")
	o := uri.Query().Get("page[offset]")
	if l == "" && o == "" && !defaultIfEmpty {
		return nil, nil
	}
	if l != "" {
		limit, err = strconv.Atoi(l)
		if err != nil || limit < 0 {
			return nil, kiterrors.InvalidArgument(fmt.Sprintf("invalid limit: %s", l))
		}
	}
	if o != "" {
		offset, err = strconv.Atoi(o)
		if err != nil || offset < 0 {
			return nil, kiterrors.InvalidArgument(fmt.Sprintf("invalid offset: %s", o))
		}
	}
	return Pagination(limit, offset), nil
}

func includedResourceObjectsFromURL(uri *url.URL) []Option {
	opts := []Option{}
	if len(uri.Query()) < 1 {
		return opts
	}
	if vals, exist := uri.Query()["include"]; exist && len(vals) > 0 {
		fNames := []string{}
		for _, val := range vals {
			for _, multiVal := range strings.Split(val, ",") { // multiple params splitted by coma for same value
				fNames = append(fNames, multiVal)
			}
		}
		opts = append(opts, IncludedResourceObjects(fNames...))
	}

	return opts
}

type parseConfig struct {
	paginateByDefault bool
}

type ParseOpt func(c *parseConfig)

func DefaultPagination(applied bool) ParseOpt {
	return func(c *parseConfig) {
		c.paginateByDefault = applied
	}
}

func SkipDefaultPagination() ParseOpt {
	return DefaultPagination(false)
}

func defaultParseOpts() []ParseOpt {
	return []ParseOpt{
		DefaultPagination(true),
	}
}

func ParseURLQueryOpts(uri *url.URL, parseOpts ...ParseOpt) ([]Option, error) {
	config := new(parseConfig)
	pOpts := append(defaultParseOpts(), parseOpts...)
	for _, opt := range pOpts {
		opt(config)
	}

	opts, err := searchFromURL(uri)
	if err != nil {
		return nil, err
	}

	pag, err := paginationFromURL(uri, config.paginateByDefault)
	if err != nil {
		return nil, err
	}
	if pag != nil {
		opts = append(opts, pag)
	}

	includedResourceObjs := includedResourceObjectsFromURL(uri)
	if len(includedResourceObjs) > 0 {
		opts = append(opts, includedResourceObjs...)
	}

	return opts, nil
}

func ParseOptsFromHTTPReq(r *http.Request, opts ...ParseOpt) ([]Option, error) {
	return ParseURLQueryOpts(r.URL, opts...)
}
