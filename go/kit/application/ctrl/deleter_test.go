package ctrl_test

import (
	"context"
	"testing"

	"github.com/dosanma1/forge/go/kit/application/ctrl"
	"github.com/dosanma1/forge/go/kit/application/repository"
	"github.com/dosanma1/forge/go/kit/application/usecase/usecasetest"
	"github.com/dosanma1/forge/go/kit/filter"
	"github.com/dosanma1/forge/go/kit/search"
	"github.com/dosanma1/forge/go/kit/search/query"
	"github.com/dosanma1/forge/go/kit/search/searchtest"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestDeleterDelete(t *testing.T) {
	q := []query.Option{
		query.FilterBy(filter.OpEq, "id", uuid.NewString()),
	}
	tests := []struct {
		name       string
		mock       func(*usecasetest.Deleter)
		deleteType repository.DeleteType
		qOpts      []query.Option
		want       string
		wantErr    error
	}{
		{
			name:       "if usecase returns error, it should return the same error",
			deleteType: repository.DeleteTypeSoft,
			qOpts:      q,
			mock: func(m *usecasetest.Deleter) {
				m.EXPECT().Delete(context.TODO(), repository.DeleteTypeSoft, mock.MatchedBy(searchtest.OptMatcherFunc(search.WithQueryOpts(q...)))).Return(assert.AnError)
			},
			wantErr: assert.AnError,
		},
		{
			name:       "if usecase returns no error, it should return nil",
			deleteType: repository.DeleteTypeSoft,
			qOpts:      q,
			mock: func(m *usecasetest.Deleter) {
				m.EXPECT().Delete(context.TODO(), repository.DeleteTypeSoft, mock.MatchedBy(searchtest.OptMatcherFunc(search.WithQueryOpts(q...)))).Return(nil)
			},
			want: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			uc := usecasetest.NewDeleter(t)
			tt.mock(uc)
			ctrlDestr := ctrl.NewDeleter(uc, tt.deleteType)
			got, err := ctrlDestr.Delete(context.TODO(), tt.qOpts)
			assert.ErrorIs(t, err, tt.wantErr)
			assert.Equal(t, tt.want, got)
		})
	}
}
