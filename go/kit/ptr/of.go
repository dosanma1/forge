package ptr

// Of returns a pointer to the provided value.
func Of[T any](v T) *T {
	return &v
}

// SliceOfPtrs returns a slice of *T from the specified values.
func SliceOf[T any](vv ...T) []*T {
	slc := make([]*T, len(vv))
	for i := range vv {
		slc[i] = Of(vv[i])
	}
	return slc
}
