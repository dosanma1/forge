package errors

import (
	"context"
	"errors"
)

func PanicIfErr(err error) {
	if err != nil {
		panic(err)
	}
}

type ErrSkipper interface {
	SkipErr(err error) bool
}

type ErrSkipFunc func(err error) bool

func (esf ErrSkipFunc) SkipErr(err error) bool {
	return esf(err)
}

func (esf ErrSkipFunc) Merge(fs ...ErrSkipper) ErrSkipFunc {
	return func(err error) bool {
		for _, f := range append(fs, esf) {
			if f.SkipErr(err) {
				return true
			}
		}

		return false
	}
}

func newErrSkipFunc(err error) ErrSkipFunc {
	return func(e error) bool {
		return errors.Is(e, err)
	}
}

func SkipContextCancelErr() ErrSkipper {
	return newErrSkipFunc(context.Canceled)
}

func SkipErrIfOneOf(errs ...error) ErrSkipFunc {
	if len(errs) < 1 {
		return ErrSkipFunc(func(err error) bool { return false })
	}

	errSkipper := newErrSkipFunc(errs[0])
	for i := 1; i < len(errs); i++ {
		errSkipper = errSkipper.Merge(newErrSkipFunc(errs[i]))
	}

	return errSkipper
}

type (
	RetriableError interface {
		error
		IsRetriable() bool
	}

	permanentError struct {
		err error
	}
)

func (pe *permanentError) Error() string {
	return pe.err.Error()
}

func (pe *permanentError) Unwrap() error {
	return pe.err
}

func (pe *permanentError) IsRetriable() bool {
	return false
}

func PermanentError(err error) *permanentError {
	return &permanentError{err: err}
}
