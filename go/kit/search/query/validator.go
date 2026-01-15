package query

import (
	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/filter"
)

type ValidationOpt func(c *validator) error

type validator struct {
	mandatoryFields []fields.Name
	optionalFields  []fields.Name
	groupedFields   [][]fields.Name
	sortFields      []fields.Name
	filterValFuncs  map[fields.Name][]filter.ValidationFunc
	mustHaveFilters bool
}

func GroupedFilters(fs ...fields.Name) ValidationOpt {
	const (
		minGroupedFilters = 2
	)
	return func(c *validator) error {
		if len(fs) < minGroupedFilters {
			return fields.NewWrappedErr("grouped filters must have at least two fields")
		}
		c.groupedFields = append(c.groupedFields, fs)

		return nil
	}
}

func MandatoryFilters(fs ...fields.Name) ValidationOpt {
	return func(c *validator) error {
		c.mandatoryFields = append(c.mandatoryFields, fs...)

		return nil
	}
}

func OptionalFilters(fs ...fields.Name) ValidationOpt {
	return func(c *validator) error {
		c.optionalFields = append(c.optionalFields, fs...)

		return nil
	}
}

func SortFields(fs ...fields.Name) ValidationOpt {
	return func(c *validator) error {
		c.sortFields = append(c.sortFields, fs...)

		return nil
	}
}

func AtLeastOneFilter() ValidationOpt {
	return func(c *validator) error {
		c.mustHaveFilters = true

		return nil
	}
}

func ValidFilter(field fields.Name, fs ...filter.ValidationFunc) ValidationOpt {
	return func(c *validator) error {
		if c.filterValFuncs[field] == nil {
			c.filterValFuncs[field] = []filter.ValidationFunc{}
		}
		c.filterValFuncs[field] = append(c.filterValFuncs[field], fs...)

		return nil
	}
}

func (v *validator) validate(q Query) error {
	if q == nil {
		return fields.NewErrInvalidNil(FieldNameQuery)
	}
	err := v.validateMustHaveFilters(q)
	if err != nil {
		return err
	}
	err = v.validateMandatoryFieldsExist(q)
	if err != nil {
		return err
	}
	err = v.validateGroupedFields(q)
	if err != nil {
		return err
	}
	err = v.validateFieldsAllowed(q)
	if err != nil {
		return err
	}
	err = v.validateFieldFilters(q)
	if err != nil {
		return err
	}
	// err = v.validateSortFieldsAllowed(q)
	// if err != nil {
	// 	return err
	// }
	err = v.validateSortFieldsDenied(q)
	if err != nil {
		return err
	}

	return nil
}

func (v *validator) validateSortFieldsDenied(q Query) error {
	for _, key := range q.Sorting().Keys() {
		found := false
		for _, allowed := range v.sortFields {
			if allowed.String() == key {
				found = true
				break
			}
		}
		if !found {
			return fields.NewErrWithFieldName(
				FieldNameQuery.Merge(FieldNameSorting, fields.Name(key)),
				fields.NewErrInvalidNil(
					FieldNameQuery.Merge(FieldNameSorting, fields.Name(key)),
				),
			)
		}
	}

	return nil
}

func (v *validator) validateSortFieldsAllowed(q Query) error {
	for _, key := range q.Sorting().Keys() {
		found := false
		for _, allowed := range v.sortFields {
			if allowed.String() == key {
				found = true
				break
			}
		}
		if !found {
			return fields.NewErrWithFieldName(
				FieldNameQuery.Merge(FieldNameSorting, fields.Name(key)),
				fields.NewErrInvalidNil(
					FieldNameQuery.Merge(FieldNameSorting, fields.Name(key)),
				),
			)
		}
	}

	return nil
}

func (v *validator) validateFieldFilters(q Query) error {
	for fName, fs := range v.filterValFuncs {
		found := q.Filters().Get(fName.String())
		if found == nil {
			continue
		}
		for _, f := range fs {
			err := f(found)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func (v *validator) validateGroupedFields(q Query) error {
	qf := q.Filters()
	for _, group := range v.groupedFields {
		anyExist := false
		keysExists := make(map[string]bool)
		for _, k := range group {
			keysExists[k.String()] = qf.Exists(k.String())
			if qf.Exists(k.String()) {
				anyExist = true
			}
		}
		if !anyExist { // none of them exist, so chec
			return nil
		}
		for _, exist := range keysExists {
			if !exist {
				return fields.NewErrWithFieldName(
					FieldNameQuery.Merge(filter.FieldNameFilters),
					fields.NewWrappedErr("filters: %+v must go together", group),
				)
			}
		}
	}

	return nil
}

func (v *validator) validateMandatoryFieldsExist(q Query) error {
	for _, field := range v.mandatoryFields {
		if !q.Filters().Exists(field.String()) {
			return fields.NewErrWithFieldName(
				FieldNameQuery.Merge(filter.FieldNameFilters, field),
				fields.NewErrInvalidNil(
					field,
				),
			)
		}
	}

	return nil
}

func (v *validator) validateInMandatory(field fields.Name) error {
	for _, mandatory := range v.mandatoryFields {
		if mandatory == field {
			return nil
		}
	}

	return fields.NewErrWithFieldName(
		FieldNameQuery.Merge(filter.FieldNameFilters, field),
		fields.NewErrInvalid(
			field,
			fields.NewWrappedErr("filter by %s is not allowed", field),
		),
	)
}

func (v *validator) validateInOptional(field fields.Name) error {
	for _, opt := range v.optionalFields {
		if opt == field {
			return nil
		}
	}

	return fields.NewErrWithFieldName(
		FieldNameQuery.Merge(filter.FieldNameFilters, field),
		fields.NewErrInvalid(
			field,
			fields.NewWrappedErr("filter by %s is not allowed", field),
		),
	)
}

func (v *validator) validateFieldsAllowed(q Query) error {
	for _, field := range q.Filters() {
		err := v.validateInMandatory(fields.Name(field.Name()))
		if err == nil {
			continue
		}
		err = v.validateInOptional(fields.Name(field.Name()))
		if err != nil {
			return err
		}
	}

	return nil
}

func (v *validator) validateMustHaveFilters(q Query) error {
	if len(v.mandatoryFields) > 0 || v.mustHaveFilters {
		if len(q.Filters()) < 1 {
			return fields.NewErrInvalidNil(
				FieldNameQuery.Merge(filter.FieldNameFilters),
			)
		}
	}

	return nil
}

func Validate(q Query, opts ...ValidationOpt) error {
	v := &validator{
		mandatoryFields: []fields.Name{},
		optionalFields:  []fields.Name{},
		sortFields:      []fields.Name{},
		filterValFuncs:  make(map[fields.Name][]filter.ValidationFunc),
	}
	for _, opt := range opts {
		err := opt(v)
		if err != nil {
			return err
		}
	}

	return v.validate(q)
}
