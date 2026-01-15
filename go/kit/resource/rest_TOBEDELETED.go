package resource

import (
	"github.com/dosanma1/forge/go/kit/jsonapi"
	"github.com/dosanma1/forge/go/kit/kslices"
)

type RelationshipDTO struct {
	RestDTO
}

type RelationshipDTOOpt func(r *RelationshipDTO)

func RelFromIdentifier(id Identifier) RelationshipDTOOpt {
	return func(r *RelationshipDTO) {
		if id == nil {
			return
		}
		RelFromIDAndType(id.ID(), Type(id.Type()))(r)
	}
}

func RelFromIDAndType(id string, kind Type) RelationshipDTOOpt {
	return func(r *RelationshipDTO) {
		r.RestDTO.RID = id
		r.RestDTO.RType = kind
	}
}

func RelationshipToDTO(opts ...RelationshipDTOOpt) *RelationshipDTO {
	r := new(RelationshipDTO)
	for _, opt := range opts {
		opt(r)
	}

	if len(r.ID()) < 1 || len(r.Type()) < 1 {
		return nil
	}

	return r
}

type (
	ListResponseDTO[DTO any] struct {
		RResults   []DTO          `json:"results"`
		Pagination *PaginationDTO `json:"pagination"`
	}

	PaginationDTO struct {
		TotalCount int `json:"totalCount"`
	}
)

func ListResponseToDTO[DTO any, R Resource](
	resMapper func(R) DTO,
) func(res ListResponse[R]) jsonapi.ListResponse[DTO] {
	return func(coll ListResponse[R]) jsonapi.ListResponse[DTO] {
		var items []R
		var count int
		if coll != nil {
			items = coll.Results()
			count = coll.TotalCount()
		}

		return &ListResponseDTO[DTO]{
			RResults: kslices.Map(items, resMapper),
			Pagination: &PaginationDTO{
				TotalCount: count,
			},
		}
	}
}

func (l *ListResponseDTO[R]) Results() []R {
	return l.RResults
}

func (l *ListResponseDTO[T]) JSONAPIMeta() *jsonapi.Meta {
	return &jsonapi.Meta{
		"pagination": &jsonapi.Meta{
			"totalCount": l.Pagination.TotalCount,
		},
	}
}
