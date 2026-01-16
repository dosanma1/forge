package slicesx_test

import (
	"fmt"
	"testing"

	"github.com/dosanma1/forge/go/kit/slicesx"
)

// BenchmarkMap benchmarks the Map function with various slice sizes.
func BenchmarkMap(b *testing.B) {
	sizes := []int{10, 100, 1000, 10000}

	for _, size := range sizes {
		b.Run(fmt.Sprintf("size_%d", size), func(b *testing.B) {
			input := make([]int, size)
			for i := range input {
				input[i] = i
			}

			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_ = slicesx.Map(input, func(n int) int { return n * 2 })
			}
		})
	}
}

// BenchmarkMapTypeConversion benchmarks Map with type conversion.
func BenchmarkMapTypeConversion(b *testing.B) {
	input := make([]int, 1000)
	for i := range input {
		input[i] = i
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = slicesx.Map(input, func(n int) string {
			return fmt.Sprintf("%d", n)
		})
	}
}

// BenchmarkFind benchmarks Find function with different scenarios.
func BenchmarkFind(b *testing.B) {
	sizes := []int{10, 100, 1000, 10000}

	for _, size := range sizes {
		b.Run(fmt.Sprintf("first_element_size_%d", size), func(b *testing.B) {
			input := make([]int, size)
			for i := range input {
				input[i] = i
			}

			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_, _ = slicesx.Find(input, func(n int) bool { return n == 0 })
			}
		})

		b.Run(fmt.Sprintf("middle_element_size_%d", size), func(b *testing.B) {
			input := make([]int, size)
			for i := range input {
				input[i] = i
			}
			target := size / 2

			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_, _ = slicesx.Find(input, func(n int) bool { return n == target })
			}
		})

		b.Run(fmt.Sprintf("not_found_size_%d", size), func(b *testing.B) {
			input := make([]int, size)
			for i := range input {
				input[i] = i
			}

			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_, _ = slicesx.Find(input, func(n int) bool { return n > size })
			}
		})
	}
}

// BenchmarkMapVsLoop compares Map performance vs traditional loop.
func BenchmarkMapVsLoop(b *testing.B) {
	input := make([]int, 1000)
	for i := range input {
		input[i] = i
	}

	b.Run("using_Map", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			_ = slicesx.Map(input, func(n int) int { return n * 2 })
		}
	})

	b.Run("using_loop", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			output := make([]int, len(input))
			for j, v := range input {
				output[j] = v * 2
			}
			_ = output
		}
	})
}
