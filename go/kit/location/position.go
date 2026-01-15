package location

type (
	Position interface {
		X() float64
		Y() float64
	}

	PositionDTO struct {
		EX float64 `jsonapi:"wrapped:x" json:"x"`
		EY float64 `jsonapi:"wrapped:y" json:"y"`
	}
)

func (dto *PositionDTO) X() float64 {
	return dto.EX
}

func (dto *PositionDTO) Y() float64 {
	return dto.EY
}
