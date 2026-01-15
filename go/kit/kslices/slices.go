package kslices

func Map[I any, O any](input []I, transform func(I) O) []O {
	o := make([]O, len(input))
	if len(input) < 1 {
		return o
	}
	for i, e := range input {
		o[i] = transform(e)
	}
	return o
}

func Find[I any](input []I, predicate func(I) bool) (element I, found bool) {
	for _, e := range input {
		if predicate(e) {
			return e, true
		}
	}

	return element, false
}
