package fields

type Parser[I, O any] func(in I) (O, error)
