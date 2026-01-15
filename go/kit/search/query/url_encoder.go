package query

import (
	"fmt"
	"net/url"
	"reflect"
	"strings"

	"github.com/dosanma1/forge/go/kit/filter"
)

// FiltersToURLValues converts query filters to url.Values with proper JSON:API format
// The format follows: filter[field][operator]=value
func FiltersToURLValues(filters Filters[any]) url.Values {
	queryParams := url.Values{}

	for fieldName, fieldFilter := range filters {
		if fieldFilter == nil {
			continue
		}

		operator := operatorToString(fieldFilter.Operator())
		value := fieldFilter.Value()

		// Handle different value types
		switch v := value.(type) {
		case nil:
			// For null values, use "null" string
			queryParams.Add(fmt.Sprintf("filter[%s][%s]", fieldName, operator), "null")
		case []string:
			// For array values (like OpIn), join with comma
			if len(v) > 0 {
				queryParams.Add(fmt.Sprintf("filter[%s][%s]", fieldName, operator), strings.Join(v, ","))
			}
		case []interface{}:
			// Convert interface slice to strings
			var strValues []string
			for _, item := range v {
				strValues = append(strValues, fmt.Sprintf("%v", item))
			}
			if len(strValues) > 0 {
				queryParams.Add(fmt.Sprintf("filter[%s][%s]", fieldName, operator), strings.Join(strValues, ","))
			}
		default:
			// Handle slice types dynamically using reflection
			valueType := reflect.TypeOf(value)
			if valueType != nil && valueType.Kind() == reflect.Slice {
				var strValues []string
				sliceValue := reflect.ValueOf(value)
				for i := 0; i < sliceValue.Len(); i++ {
					item := sliceValue.Index(i).Interface()
					strValues = append(strValues, fmt.Sprintf("%v", item))
				}
				if len(strValues) > 0 {
					queryParams.Add(fmt.Sprintf("filter[%s][%s]", fieldName, operator), strings.Join(strValues, ","))
				}
			} else {
				// Single value
				queryParams.Add(fmt.Sprintf("filter[%s][%s]", fieldName, operator), fmt.Sprintf("%v", value))
			}
		}
	}

	return queryParams
}

// operatorToString converts filter operators to their string representation for URLs
func operatorToString(op filter.Operator) string {
	switch op {
	case filter.OpEq:
		return "eq"
	case filter.OpNEq:
		return "neq"
	case filter.OpGT:
		return "gt"
	case filter.OpGTEq:
		return "gte"
	case filter.OpLT:
		return "lt"
	case filter.OpLTEq:
		return "lte"
	case filter.OpIn:
		return "in"
	case filter.OpNotIn:
		return "not-in"
	case filter.OpLike:
		return "like"
	case filter.OpBetween:
		return "between"
	case filter.OpContains:
		return "contains"
	case filter.OpContainsLike:
		return "contains-like"
	case filter.OpIs:
		return "is"
	case filter.OpIsNot:
		return "is-not"
	default:
		return "eq" // fallback
	}
}

// AddFilterParam is a convenience function to add a single filter parameter
func AddFilterParam(queryParams url.Values, fieldName string, operator filter.Operator, value interface{}) {
	filters := make(Filters[any])
	filters[fieldName] = filter.NewFieldFilter(operator, fieldName, value)

	// Merge the new filter into existing params
	newParams := FiltersToURLValues(filters)
	for key, values := range newParams {
		for _, v := range values {
			queryParams.Add(key, v)
		}
	}
}
