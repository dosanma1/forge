package persistencetest

import (
	context "context"

	"github.com/dosanma1/forge/go/kit/persistence"
)

type transactionerStub struct{}

func NewTransactioner() *transactionerStub {
	return &transactionerStub{}
}

func (ts *transactionerStub) Exec(ctx context.Context, fn persistence.TxFunc) error {
	err := fn(ctx)
	if err != nil {
		return err
	}
	return nil
}
