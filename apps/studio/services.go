package main

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// Project represents a Forge project
type Project struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	ImageURL    string    `json:"imageURL"`
	Path        string    `json:"path"`
	LastOpen    time.Time `json:"lastOpen"`
}

// ProjectService handles project operations exposed to the frontend
type ProjectService struct {
	app *application.App
}

// OnStartup is called when the app starts
func (p *ProjectService) OnStartup(ctx context.Context, options application.ServiceOptions) error {
	p.app = application.Get()
	return nil
}

// ListProjects returns all recent projects
func (p *ProjectService) ListProjects() ([]Project, error) {
	recentPath := filepath.Join(os.Getenv("HOME"), ".forge", "recent_projects.json")

	data, err := os.ReadFile(recentPath)
	if err != nil {
		if os.IsNotExist(err) {
			return []Project{}, nil
		}
		return nil, err
	}

	var projects []Project
	if err := json.Unmarshal(data, &projects); err != nil {
		return nil, err
	}

	return projects, nil
}

// CreateProject creates a new project at the given path
func (p *ProjectService) CreateProject(name, path, description string) (*Project, error) {
	// Create the project directory if it doesn't exist
	if err := os.MkdirAll(path, 0755); err != nil {
		return nil, err
	}

	// Create forge.json
	forgeJsonPath := filepath.Join(path, "forge.json")
	projectConfig := map[string]interface{}{
		"name":        name,
		"description": description,
		"version":     "1.0.0",
	}
	configData, err := json.MarshalIndent(projectConfig, "", "  ")
	if err != nil {
		return nil, err
	}
	if err := os.WriteFile(forgeJsonPath, configData, 0644); err != nil {
		return nil, err
	}

	project := &Project{
		ID:          path,
		Name:        name,
		Description: description,
		Path:        path,
		LastOpen:    time.Now(),
	}

	// Add to recent projects
	if err := p.addToRecent(project); err != nil {
		return nil, err
	}

	return project, nil
}

// OpenProject opens a project by path and adds it to recent projects
func (p *ProjectService) OpenProject(path string) (*Project, error) {
	// Check if forge.json exists
	forgeJsonPath := filepath.Join(path, "forge.json")
	if _, err := os.Stat(forgeJsonPath); os.IsNotExist(err) {
		return nil, err
	}

	// Read project config
	data, err := os.ReadFile(forgeJsonPath)
	if err != nil {
		return nil, err
	}

	var config map[string]interface{}
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	name := filepath.Base(path)
	description := ""
	if n, ok := config["name"].(string); ok {
		name = n
	}
	if d, ok := config["description"].(string); ok {
		description = d
	}

	project := &Project{
		ID:          path,
		Name:        name,
		Description: description,
		Path:        path,
		LastOpen:    time.Now(),
	}

	// Add to recent projects
	if err := p.addToRecent(project); err != nil {
		return nil, err
	}

	return project, nil
}

// SelectDirectory opens a native directory picker dialog
func (p *ProjectService) SelectDirectory() (string, error) {
	app := application.Get()
	if app == nil {
		return "", nil
	}
	return app.Dialog.OpenFile().
		SetTitle("Select Project Folder").
		CanChooseDirectories(true).
		CanChooseFiles(false).
		PromptForSingleSelection()
}

// ReadFile reads a file from the filesystem
func (p *ProjectService) ReadFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// WriteFile writes content to a file
func (p *ProjectService) WriteFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}

// GetGitBranch returns the current git branch for the given path
func (p *ProjectService) GetGitBranch(path string) string {
	cmd := exec.Command("git", "rev-parse", "--abbrev-ref", "HEAD")
	cmd.Dir = path
	output, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(output))
}

// ListGitBranches returns all local git branches for the given path
func (p *ProjectService) ListGitBranches(path string) ([]string, error) {
	cmd := exec.Command("git", "branch", "--format=%(refname:short)")
	cmd.Dir = path
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	var branches []string
	for _, line := range lines {
		branch := strings.TrimSpace(line)
		if branch != "" {
			branches = append(branches, branch)
		}
	}
	return branches, nil
}

// SwitchGitBranch switches to the specified branch for the given path
func (p *ProjectService) SwitchGitBranch(path string, branch string) error {
	cmd := exec.Command("git", "checkout", branch)
	cmd.Dir = path
	return cmd.Run()
}

// ListDirectory lists files in a directory
func (p *ProjectService) ListDirectory(path string) ([]FileInfo, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	var files []FileInfo
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}
		files = append(files, FileInfo{
			Name:  entry.Name(),
			IsDir: entry.IsDir(),
			Size:  info.Size(),
		})
	}

	return files, nil
}

// FileInfo represents file metadata
type FileInfo struct {
	Name  string `json:"name"`
	IsDir bool   `json:"isDir"`
	Size  int64  `json:"size"`
}

// addToRecent adds a project to the recent projects list
func (p *ProjectService) addToRecent(project *Project) error {
	forgeDir := filepath.Join(os.Getenv("HOME"), ".forge")
	if err := os.MkdirAll(forgeDir, 0755); err != nil {
		return err
	}

	recentPath := filepath.Join(forgeDir, "recent_projects.json")

	var projects []Project
	data, err := os.ReadFile(recentPath)
	if err == nil {
		json.Unmarshal(data, &projects)
	}

	// Remove existing entry with same path
	filtered := make([]Project, 0)
	for _, p := range projects {
		if p.Path != project.Path {
			filtered = append(filtered, p)
		}
	}

	// Add new project at the beginning
	projects = append([]Project{*project}, filtered...)

	// Keep only last 10 projects
	if len(projects) > 10 {
		projects = projects[:10]
	}

	data, err = json.MarshalIndent(projects, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(recentPath, data, 0644)
}
