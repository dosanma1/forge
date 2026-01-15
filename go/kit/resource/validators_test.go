package resource_test

import (
	"testing"
	"time"

	"github.com/golang/mock/gomock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	apierrors "github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/resource"
	"github.com/dosanma1/forge/go/kit/resource/resourcetest"
)

const FieldNameTest fields.Name = "test"

func TestValidateFieldReference(t *testing.T) {
	tests := []struct {
		name         string
		mockResource func(ctrl *gomock.Controller) resource.Resource
		wantErr      error
	}{
		{
			name: "if resource is nil, return error",
			mockResource: func(ctrl *gomock.Controller) resource.Resource {
				return nil
			},
			wantErr: fields.NewErrNil(FieldNameTest),
		},
		{
			name: "if channel id is empty, return error",
			mockResource: func(ctrl *gomock.Controller) resource.Resource {
				res := resourcetest.NewStub(resourcetest.WithID(""))
				return res
			},
			wantErr: fields.NewErrInvalidEmptyString(FieldNameTest.Merge(fields.NameID)),
		},
		{
			name: "if channel is valid, return nil",
			mockResource: func(ctrl *gomock.Controller) resource.Resource {
				res := resourcetest.NewStub(resourcetest.WithID("res_id"))
				return res
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			err := resource.FieldValidator(FieldNameTest)(tt.mockResource(ctrl))
			assert.ErrorIs(t, err, tt.wantErr)
		})
	}
}

func TestValidatorNonCreateOp(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		in     resource.Resource
		inType resource.Type
		want   error
	}{
		{
			name:   "empty resource",
			in:     nil,
			inType: resourcetest.ResourceTypeStub,
			want:   fields.NewErrInvalidNil(fields.Name(resourcetest.ResourceTypeStub)),
		},
		{
			name:   "empty id",
			in:     resourcetest.NewStub(resourcetest.WithID("")),
			inType: resourcetest.ResourceTypeStub,
			want:   apierrors.New(apierrors.CodeMissingField),
		},
		{
			name:   "different types",
			in:     resourcetest.NewStub(resourcetest.WithID(uuid.NewString())),
			inType: resource.Type("atesttype"),
			want: fields.NewErrInvalidValue(
				fields.NameType, resourcetest.NewStub(resourcetest.WithID("")).Type(),
			),
		},
		{
			name: "creation time zero",
			in: resourcetest.NewStub(
				resourcetest.WithID(uuid.NewString()),
				resourcetest.WithCreatedAt(time.Time{}),
			),
			inType: resource.Type(resourcetest.NewStub().Type()),
			want:   apierrors.New(apierrors.CodeValidationFailed),
		},
		{
			name: "updated time zero",
			in: resourcetest.NewStub(
				resourcetest.WithID(uuid.NewString()),
				resourcetest.WithCreatedAt(time.Now().UTC()),
				resourcetest.WithUpdatedAt(time.Time{}),
			),
			inType: resource.Type(resourcetest.NewStub().Type()),
			want:   apierrors.New(apierrors.CodeValidationFailed),
		},
		{
			name: "valid resource",
			in: resourcetest.NewStub(
				resourcetest.WithID(uuid.NewString()),
				resourcetest.WithCreatedAt(time.Now().UTC()),
				resourcetest.WithUpdatedAt(time.Now().UTC()),
			),
			inType: resource.Type(resourcetest.NewStub().Type()),
			want:   nil,
		},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			assert.ErrorIs(t, resource.ValidateID(test.inType)(test.in), test.want)
		})
	}
}

func TestValidatorCreateOp(t *testing.T) {
	t.Parallel()

	resID := uuid.NewString()
	creationTime := time.Now().UTC()
	updateTime := creationTime.Add(1 * time.Second)

	tests := []struct {
		name   string
		in     resource.Resource
		inType resource.Type
		want   error
	}{
		{
			name:   "empty resource",
			in:     nil,
			inType: resourcetest.ResourceTypeStub,
			want:   fields.NewErrInvalidNil(fields.Name(resourcetest.ResourceTypeStub)),
		},
		{
			name: "not empty id",
			in: resourcetest.NewStub(
				resourcetest.WithID(resID),
				resourcetest.WithCreatedAt(time.Time{}),
				resourcetest.WithCreatedAt(time.Time{}),
				resourcetest.WithDeletedAt(nil),
			),
			inType: resourcetest.ResourceTypeStub,
			want:   apierrors.New(apierrors.CodeValidationFailed),
		},
		{
			name: "with creation time",
			in: resourcetest.NewStub(
				resourcetest.WithID(""),
				resourcetest.WithCreatedAt(creationTime),
				resourcetest.WithUpdatedAt(time.Time{}),
				resourcetest.WithDeletedAt(nil),
			),
			inType: resourcetest.ResourceTypeStub,
			want:   apierrors.New(apierrors.CodeValidationFailed),
		},
		{
			name: "with update time",
			in: resourcetest.NewStub(
				resourcetest.WithID(""),
				resourcetest.WithCreatedAt(time.Time{}),
				resourcetest.WithUpdatedAt(updateTime),
				resourcetest.WithDeletedAt(nil),
			),
			inType: resourcetest.ResourceTypeStub,
			want:   apierrors.New(apierrors.CodeValidationFailed),
		},
		{
			name: "with deletion time",
			in: resourcetest.NewStub(
				resourcetest.WithID(""),
				resourcetest.WithCreatedAt(time.Time{}),
				resourcetest.WithUpdatedAt(time.Time{}),
				resourcetest.WithDeletedAt(&time.Time{}),
			),
			inType: resourcetest.ResourceTypeStub,
			want:   apierrors.New(apierrors.CodeValidationFailed),
		},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			assert.ErrorIs(t,
				resource.ValidateID(test.inType, resource.ValidForCreation())(test.in),
				test.want,
			)
		})
	}
}

func TestValidatorID(t *testing.T) {
	t.Parallel()

	fieldNameOverride := fields.Name("aname")
	tests := []struct {
		name   string
		opts   []resource.ValidatorIDOpt
		in     resource.Identifier
		inType resource.Type
		want   error
	}{
		{
			name:   "empty no fieldname override",
			in:     nil,
			inType: resourcetest.ResourceTypeStub,
			want:   fields.NewErrInvalidNil(fields.Name(resourcetest.ResourceTypeStub)),
		},
		{
			name: "empty with fieldname override",
			opts: []resource.ValidatorIDOpt{
				resource.ValidIDField(fieldNameOverride),
			},
			in:     nil,
			inType: resourcetest.ResourceTypeStub,
			want:   fields.NewErrInvalidNil(fieldNameOverride),
		},
		{
			name: "different type no fieldname override",
			in: resourcetest.NewStub(
				resourcetest.WithType("differenttype"),
			),
			inType: resourcetest.ResourceTypeStub,
			want:   fields.NewErrInvalidValue(fields.NameType, "differenttype"),
		},
		{
			name: "empty with fieldname override",
			opts: []resource.ValidatorIDOpt{
				resource.ValidIDField(fieldNameOverride),
			},
			in: resourcetest.NewStub(
				resourcetest.WithType("differenttype"),
			),
			inType: resourcetest.ResourceTypeStub,
			want:   fields.NewErrInvalidValue(fieldNameOverride, "differenttype"),
		},
		{
			name:   "no id no fieldname override",
			in:     resourcetest.NewStub(resourcetest.WithID("")),
			inType: resourcetest.ResourceTypeStub,
			want:   fields.NotEmptyStringValidator(fields.NameID)(""),
		},
		{
			name: "empty with fieldname override",
			opts: []resource.ValidatorIDOpt{
				resource.ValidIDField(fieldNameOverride),
			},
			in:     resourcetest.NewStub(resourcetest.WithID("")),
			inType: resourcetest.ResourceTypeStub,
			want:   fields.NotEmptyStringValidator(fieldNameOverride.Merge(fields.NameID))(""),
		},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			assert.ErrorIs(t,
				resource.ValidateIdentifier(test.inType, test.opts...)(test.in),
				test.want,
			)
		})
	}
}
