package global

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/dosanma1/forge/go/kit/transport/rest"
)

func NewGlobalController(manager *GlobalManager) rest.Controller {
	return &GlobalController{manager: manager}
}

type GlobalController struct {
	manager *GlobalManager
}

func (c *GlobalController) BasePath() string {
	return "/projects"
}

func (c *GlobalController) Version() string {
	return ""
}

func (c *GlobalController) Endpoints() []rest.Endpoint {
	return []rest.Endpoint{
		// JSON API List endpoint (GET /projects)
		rest.NewListEndpoint(http.HandlerFunc(c.handleList)),
		// JSON API Create endpoint (POST /projects)
		rest.NewCreateEndpoint(http.HandlerFunc(c.handleCreateProject)),
		// Custom endpoint for opening existing projects
		rest.NewEndpoint(http.MethodPost, "/open", http.HandlerFunc(c.handleOpenProject)),
	}
}

// JSON API response structures
type jsonAPIResource struct {
	ID         string                 `json:"id"`
	Type       string                 `json:"type"`
	Attributes map[string]interface{} `json:"attributes"`
}

type jsonAPIListResponse struct {
	Data []jsonAPIResource `json:"data"`
	Meta map[string]any    `json:"meta,omitempty"`
}

type jsonAPISingleResponse struct {
	Data jsonAPIResource `json:"data"`
}

type jsonAPIErrorResponse struct {
	Errors []jsonAPIError `json:"errors"`
}

type jsonAPIError struct {
	Status string `json:"status"`
	Title  string `json:"title"`
	Detail string `json:"detail"`
}

// handleList returns the list of recent projects in JSON API format
func (c *GlobalController) handleList(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projects, err := c.manager.ListRecent(ctx)
	if err != nil {
		c.writeJSONAPIError(w, http.StatusInternalServerError, err)
		return
	}

	resources := make([]jsonAPIResource, len(projects))
	for i, p := range projects {
		resources[i] = jsonAPIResource{
			ID:   p.Path,
			Type: "projects",
			Attributes: map[string]interface{}{
				"name":        p.Name,
				"description": "",
				"imageURL":    "",
				"path":        p.Path,
				"lastOpened":  p.LastOpened,
			},
		}
	}

	response := jsonAPIListResponse{
		Data: resources,
		Meta: map[string]any{
			"pagination": map[string]any{
				"totalCount": len(projects),
			},
		},
	}

	c.writeJSON(w, http.StatusOK, response)
}

// Request Payload for /open
type OpenProjectRequest struct {
	Path string `json:"path"`
}

func (c *GlobalController) handleOpenProject(w http.ResponseWriter, r *http.Request) {
	var req OpenProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.writeJSONAPIError(w, http.StatusBadRequest, err)
		return
	}

	ctx := r.Context()
	if err := c.manager.AddRecent(ctx, req.Path); err != nil {
		c.writeJSONAPIError(w, http.StatusBadRequest, err)
		return
	}

	// Return the opened project in JSON API format
	projects, _ := c.manager.ListRecent(ctx)
	for _, p := range projects {
		if p.Path == req.Path {
			response := jsonAPISingleResponse{
				Data: jsonAPIResource{
					ID:   p.Path,
					Type: "projects",
					Attributes: map[string]interface{}{
						"name":        p.Name,
						"description": "",
						"imageURL":    "",
						"path":        p.Path,
						"lastOpened":  p.LastOpened,
					},
				},
			}
			c.writeJSON(w, http.StatusOK, response)
			return
		}
	}

	c.writeJSONAPIError(w, http.StatusNotFound, fmt.Errorf("project not found"))
}

// JSON API create request structure
type jsonAPICreateRequest struct {
	Data struct {
		Type       string `json:"type"`
		Attributes struct {
			Name        string `json:"name"`
			Path        string `json:"path"`
			Description string `json:"description,omitempty"`
		} `json:"attributes"`
	} `json:"data"`
}

// handleCreateProject creates a new project and returns it in JSON API format
func (c *GlobalController) handleCreateProject(w http.ResponseWriter, r *http.Request) {
	var req jsonAPICreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.writeJSONAPIError(w, http.StatusBadRequest, err)
		return
	}

	name := req.Data.Attributes.Name
	path := req.Data.Attributes.Path

	if name == "" || path == "" {
		c.writeJSONAPIError(w, http.StatusBadRequest, fmt.Errorf("name and path are required"))
		return
	}

	ctx := r.Context()
	if err := c.manager.CreateProject(ctx, path, name); err != nil {
		c.writeJSONAPIError(w, http.StatusInternalServerError, err)
		return
	}

	// Return the created project
	projects, _ := c.manager.ListRecent(ctx)
	for _, p := range projects {
		if p.Path == path {
			response := jsonAPISingleResponse{
				Data: jsonAPIResource{
					ID:   p.Path,
					Type: "projects",
					Attributes: map[string]interface{}{
						"name":        p.Name,
						"description": "",
						"imageURL":    "",
						"path":        p.Path,
						"lastOpened":  p.LastOpened,
					},
				},
			}
			c.writeJSON(w, http.StatusCreated, response)
			return
		}
	}

	c.writeJSONAPIError(w, http.StatusInternalServerError, fmt.Errorf("project created but not found"))
}

func (c *GlobalController) writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/vnd.api+json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (c *GlobalController) writeJSONAPIError(w http.ResponseWriter, status int, err error) {
	w.Header().Set("Content-Type", "application/vnd.api+json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(jsonAPIErrorResponse{
		Errors: []jsonAPIError{
			{
				Status: fmt.Sprintf("%d", status),
				Title:  http.StatusText(status),
				Detail: err.Error(),
			},
		},
	})
}
