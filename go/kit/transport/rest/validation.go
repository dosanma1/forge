package rest

import (
	"github.com/dosanma1/forge/go/kit/errors"
	"github.com/dosanma1/forge/go/kit/resource"
)

func validateUpdateReqData[R resource.Resource](kind resource.Type, data R) error {
	if data.ID() == "" {
		return errors.InvalidArgument("missing resource ID")
	}

	if data.Type() != kind {
		return errors.InvalidArgument("resource type mismatch")
	}
	return nil
}
