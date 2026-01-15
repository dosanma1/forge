package persistence

import "context"

type TxFunc func(txCtx context.Context) error

type Transactioner interface {
	// Exec runs fn function within a transaction. It internally injects DB client with opened transaction in ctx.
	// If fn returns an error, a rollback will be automatically done. If fn doesn't return an error, transaction will be committed.
	//
	// IMPORTANT: You MUST use txCtx context in every repo call within the fn callback, otherwise transaction won't take effect.
	// The following snippet is an example on how to use it in any use case:
	//
	// err := uc.tx.Exec(ctx, func(txCtx context.Context) error {
	//	createUser := &userAccount{}
	//	u, err := uc.repo.Create(txCtx, createUser)   // here you MUST use txCtx, NOT ctx !!
	//	if err != nil {
	//		return err
	//	}
	//	return nil
	// })
	// if err != nil {
	// 	return nil, err
	// }
	Exec(ctx context.Context, f TxFunc) error
}
