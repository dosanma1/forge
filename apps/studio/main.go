package main

import (
	"embed"
	_ "embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// Wails uses Go's `embed` package to embed the frontend files into the binary.
// The Angular build output is at ../../dist/apps/studio/browser from apps/studio.

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create a new Wails application
	app := application.New(application.Options{
		Name:        "Forge Studio",
		Description: "Visual no-code backend development platform",
		Services: []application.Service{
			application.NewService(&ProjectService{}),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	// Create the main window
	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:  "Forge Studio",
		Width:  1400,
		Height: 900,
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(18, 18, 18), // Dark mode #121212
		URL:              "/",
	})

	// Run the application
	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
