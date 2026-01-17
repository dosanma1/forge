// Package rest provides a comprehensive HTTP/REST server and client framework.
//
// Features:
//   - HTTP server setup with functional options
//   - RESTful routing with controllers
//   - Middleware support with chaining
//   - JSON encoding/decoding
//   - Error handling
//   - Health check endpoints (built-in)
//   - TLS support
//   - Authentication middleware
//   - Fx dependency injection integration
//
// Basic server usage:
//
//	server := rest.NewServer(
//	    rest.WithAddress(":8080"),
//	    rest.WithControllers(myController),
//	)
//	server.ListenAndServe()
//
// With middleware:
//
//	server := rest.NewServer(
//	    rest.WithAddress(":8080"),
//	    rest.WithMiddlewares(
//	        authMiddleware,
//	        loggingMiddleware,
//	    ),
//	)
//
// Client usage:
//
//	client := rest.NewClient("https://api.example.com")
//	resp, err := client.Call(ctx, "GET", "/users", request, &response)
package rest
