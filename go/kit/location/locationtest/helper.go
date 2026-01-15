package locationtest

import "github.com/dosanma1/forge/go/kit/location"

func MatchPosition(want location.Position) func(location.Position) bool {
	return func(got location.Position) bool {
		if want == nil {
			return got == nil
		}

		return want.X() == got.X() && want.Y() == got.Y()
	}
}
