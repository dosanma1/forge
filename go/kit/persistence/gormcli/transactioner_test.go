package gormcli_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/dosanma1/forge/go/kit/monitoring/logger/loggertest"
	"github.com/dosanma1/forge/go/kit/persistence/gormcli"
	"github.com/dosanma1/forge/go/kit/persistence/pg/pgtest"
	"github.com/dosanma1/forge/go/kit/ptr"
)

func TestTransactioner(t *testing.T) {
	l := loggertest.NewStubLogger(t)
	db := pgtest.GetDB(t, pgtest.TestSchema)

	res := testResource{Name: "test 1"}

	tests := []struct {
		name       string
		exec       func(txCtx context.Context) error
		want       []testResource
		wantErrStr *string
	}{
		{
			name: "commit",
			exec: func(txCtx context.Context) error {
				res := testResource{Name: "test 2"}
				err := db.DBClient.WithContext(txCtx).Create(&res).Error
				require.NoError(t, err)
				return nil
			},
			want:       []testResource{{Name: "test 1"}, {Name: "test 2"}},
			wantErrStr: nil,
		},
		{
			name: "rollback",
			exec: func(txCtx context.Context) error {
				// trying to create a resource with same ID as an existing one will fail
				err := db.DBClient.WithContext(txCtx).Create(&res).Error
				assert.Error(t, err)
				return err
			},
			want:       []testResource{{Name: "test 1"}},
			wantErrStr: ptr.Of(`ERROR: duplicate key value violates unique constraint "test_resource_pkey" (SQLSTATE 23505)`),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			clearTestTable(t, db.DBClient)

			err := db.Create(&res).Error
			require.NoError(t, err)

			ctx := context.TODO()
			tx := gormcli.NewTransactioner(db.DBClient, l)
			err = tx.Exec(ctx, test.exec)

			if test.wantErrStr != nil {
				assert.Error(t, err)
				assert.Equal(t, *test.wantErrStr, err.Error())
			} else {
				assert.NoError(t, err)
			}
			var resList []testResource
			err = db.Find(&resList).Error
			require.NoError(t, err)

			assert.Len(t, resList, len(test.want))
			for k, r := range test.want {
				assert.Equal(t, r.Name, resList[k].Name)
			}
			clearTestTable(t, db.DBClient)
		})
	}
}

func clearTestTable(t *testing.T, db *gormcli.DBClient) {
	t.Helper()

	err := db.Exec(`TRUNCATE "test_resource" CASCADE;`).Error
	require.NoError(t, err)
}

func TestTransactionerWithChildren(t *testing.T) {
	l := loggertest.NewStubLogger(t)
	db := pgtest.GetDB(t, pgtest.TestSchema)

	res := testResource{Name: "A"}
	clearTestTable(t, db.DBClient)

	err := db.Create(&res).Error
	require.NoError(t, err)

	ctx := context.TODO()
	tx := gormcli.NewTransactioner(db.DBClient, l)

	// -- Setup test
	createOp := func(name string, wantErr error) func(txCtx context.Context) error {
		return func(txCtx context.Context) error {
			res := testResource{Name: name}
			err := db.DBClient.WithContext(txCtx).Create(&res).Error
			require.NoError(t, err)
			return wantErr
		}
	}

	execFn := func(txCtx context.Context) error {
		res := testResource{Name: "B"}
		err := db.DBClient.WithContext(txCtx).Create(&res).Error
		require.NoError(t, err)
		// Resource created but not committed yet
		assertDBFindExpect(t, []testResource{{Name: "A"}})

		err = tx.Exec(ctx, createOp("C", assert.AnError))
		assert.Error(t, err)
		assert.Equal(t, assert.AnError, err)
		// Creation failed so it rollback the operation
		assertDBFindExpect(t, []testResource{{Name: "A"}})

		err = tx.Exec(ctx, createOp("D", nil))
		assert.NoError(t, err)
		// Creation succesfull and committed
		assertDBFindExpect(t, []testResource{{Name: "A"}, {Name: "D"}})
		return nil
	}

	// Execute test
	err = tx.Exec(ctx, execFn)
	assert.NoError(t, err)
	assertDBFindExpect(t, []testResource{{Name: "A"}, {Name: "B"}, {Name: "D"}})

	// Cleanup
	clearTestTable(t, db.DBClient)
}

func assertDBFindExpect(t *testing.T, expect []testResource) {
	t.Helper()

	db := pgtest.GetDB(t, pgtest.TestSchema)
	var resList []testResource
	err := db.Find(&resList).Error
	require.NoError(t, err)

	// Validate result
	assert.Len(t, resList, len(expect))
	for k, r := range expect {
		assert.Equal(t, r.Name, resList[k].Name)
	}
}
