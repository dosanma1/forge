package ptr

// To returns the value pointed to by the pointer or its zero value.
func To[T any](p *T) T {
	if p == nil {
		var zero T
		return zero
	}
	return *p
}

// SliceTo returns a slice of values pointed to by the pointers or their zero values.
func SliceTo[T any](ps ...*T) []T {
	slc := make([]T, len(ps))
	for i := range ps {
		slc[i] = To(ps[i])
	}
	return slc
}
