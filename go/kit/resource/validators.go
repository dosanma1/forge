package resource

import (
	"time"

	"github.com/dosanma1/forge/go/kit/fields"
)

func FieldValidator(fName fields.Name) fields.Validator[Resource] {
	return func(r Resource) error {
		if r == nil {
			return fields.NewErrNil(fName)
		}

		if r.ID() == "" {
			return fields.NewErrInvalidEmptyString(fName.Merge(fields.NameID))
		}

		return nil
	}
}

type operation int

const (
	opRead operation = iota
	opCreate
	opUpdate
	opDelete
)

type validatorConfig struct {
	op operation
}

type ValidatorOpt func(c *validatorConfig)

func validateWithOp(op operation) ValidatorOpt {
	return func(c *validatorConfig) {
		c.op = op
	}
}

func ValidForCreation() ValidatorOpt {
	return validateWithOp(opCreate)
}

func ValidForUpdate() ValidatorOpt {
	return validateWithOp(opUpdate)
}

func defaultValidatorOpts() []ValidatorOpt {
	return []ValidatorOpt{validateWithOp(opRead)}
}

func ValidateIDs(resourceType Type, opts ...ValidatorOpt) fields.Validator[[]Resource] {
	return func(resources []Resource) error {
		for _, r := range resources {
			if err := ValidateID(resourceType, opts...)(r); err != nil {
				return err
			}
		}

		return nil
	}
}

func ValidateID(resourceType Type, opts ...ValidatorOpt) fields.Validator[Resource] {
	c := new(validatorConfig)
	for _, opt := range append(defaultValidatorOpts(), opts...) {
		opt(c)
	}

	return func(r Resource) error {
		if r == nil {
			return fields.NewErrInvalidNil(fields.Name(resourceType))
		}
		if Type(r.Type()) != resourceType {
			return fields.NewErrInvalidValue(fields.NameType, r.Type())
		}

		switch c.op {
		case opCreate:
			if err := fields.EmptyStringValidator(fields.NameID)(r.ID()); err != nil {
				return err
			}
			if err := fields.ZeroValidator[time.Time](fields.NameCreationTime)(r.CreatedAt()); err != nil {
				return err
			}
			if err := fields.ZeroValidator[time.Time](fields.NameUpdatedTime)(r.UpdatedAt()); err != nil {
				return err
			}
			if err := fields.NilValidator(fields.NameDeletionTime)(r.DeletedAt()); err != nil {
				return err
			}
		case opUpdate, opDelete, opRead:
			if err := fields.NotEmptyStringValidator(fields.NameID)(r.ID()); err != nil {
				return err
			}
			if err := fields.NotZeroValidator[time.Time](fields.NameCreationTime)(r.CreatedAt()); err != nil {
				return err
			}

			return fields.NotZeroValidator[time.Time](fields.NameUpdatedTime)(r.UpdatedAt())
		default:
			panic("invalid op")
		}

		return nil
	}
}

type validatorIDConfig struct {
	fieldName fields.Name
}

type ValidatorIDOpt func(c *validatorIDConfig)

func ValidIDField(name fields.Name) ValidatorIDOpt {
	return func(c *validatorIDConfig) {
		c.fieldName = name
	}
}

func ValidateIdentifiers(resourceType Type, opts ...ValidatorIDOpt) fields.Validator[[]Identifier] {
	return func(ids []Identifier) error {
		for _, id := range ids {
			if err := ValidateIdentifier(resourceType, opts...)(id); err != nil {
				return err
			}
		}

		return nil
	}
}

func ValidateIdentifier(resourceType Type, opts ...ValidatorIDOpt) fields.Validator[Identifier] {
	c := new(validatorIDConfig)
	for _, opt := range opts {
		opt(c)
	}

	fieldNameOr := func(val fields.Name) fields.Name {
		if c.fieldName.String() != "" {
			return c.fieldName
		}

		return val
	}
	fieldNameAnd := func(val fields.Name) fields.Name {
		if c.fieldName.String() != "" {
			return c.fieldName.Merge(val)
		}

		return val
	}

	return func(r Identifier) error {
		if r == nil {
			return fields.NewErrInvalidNil(fieldNameOr(fields.Name(resourceType)))
		}
		if Type(r.Type()) != resourceType {
			return fields.NewErrInvalidValue(fieldNameOr(fields.NameType), r.Type())
		}

		return fields.NotEmptyStringValidator(fieldNameAnd(fields.NameID))(r.ID())
	}
}
