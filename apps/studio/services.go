package main

import (
	"context"
	"encoding/json"
	"fmt"
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

// InitialProject represents an optional initial project to create within a workspace
type InitialProject struct {
	Name        string `json:"name"`
	ProjectType string `json:"projectType"` // service, application, library
	Language    string `json:"language"`    // go, nestjs, angular, nextjs, typescript
	Deployer    string `json:"deployer"`    // helm, cloudrun, firebase (optional for libraries)
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

// ListProjects returns all recent projects, filtering out deleted ones
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

	// Filter out projects whose paths no longer exist
	validProjects := make([]Project, 0)
	for _, proj := range projects {
		if _, err := os.Stat(proj.Path); err == nil {
			validProjects = append(validProjects, proj)
		}
	}

	// If we filtered some out, save the cleaned list
	if len(validProjects) != len(projects) {
		cleanedData, _ := json.MarshalIndent(validProjects, "", "  ")
		os.WriteFile(recentPath, cleanedData, 0644)
	}

	return validProjects, nil
}

// CreateProject creates a new project at the given path with proper forge.json structure
func (p *ProjectService) CreateProject(name, path string, initialProjects []InitialProject) (*Project, error) {
	// Create the project directory if it doesn't exist
	if err := os.MkdirAll(path, 0755); err != nil {
		return nil, err
	}

	// Build projects map
	projects := map[string]interface{}{}

	for _, initialProject := range initialProjects {
		if initialProject.Name == "" {
			continue
		}
		projectRoot := initialProject.Name

		// Build architect config
		architect := map[string]interface{}{
			"build": map[string]interface{}{
				"builder": "@forge/bazel:build",
				"options": map[string]interface{}{},
				"configurations": map[string]interface{}{
					"development": map[string]interface{}{},
					"production":  map[string]interface{}{},
				},
				"defaultConfiguration": "production",
			},
		}

		// Add deploy config for non-libraries
		if initialProject.ProjectType != "library" && initialProject.Deployer != "" {
			deployConfig := map[string]interface{}{
				"deployer": initialProject.Deployer,
				"options":  map[string]interface{}{},
				"configurations": map[string]interface{}{
					"development": map[string]interface{}{},
					"production":  map[string]interface{}{},
				},
				"defaultConfiguration": "production",
			}
			architect["deploy"] = deployConfig
		}

		projects[initialProject.Name] = map[string]interface{}{
			"projectType": initialProject.ProjectType,
			"language":    initialProject.Language,
			"root":        projectRoot,
			"tags":        []string{},
			"architect":   architect,
		}

		// Create project directory
		if err := os.MkdirAll(filepath.Join(path, projectRoot), 0755); err != nil {
			return nil, err
		}
	}

	// Create forge.json with proper workspace structure
	forgeJsonPath := filepath.Join(path, "forge.json")
	projectConfig := map[string]interface{}{
		"$schema": "https://raw.githubusercontent.com/dosanma1/forge-cli/main/schemas/forge-config.v1.schema.json",
		"version": "1",
		"workspace": map[string]interface{}{
			"name":         name,
			"forgeVersion": "1.0.0",
		},
		"newProjectRoot": ".",
		"projects":       projects,
	}
	configData, err := json.MarshalIndent(projectConfig, "", "  ")
	if err != nil {
		return nil, err
	}
	if err := os.WriteFile(forgeJsonPath, configData, 0644); err != nil {
		return nil, err
	}

	project := &Project{
		ID:       path,
		Name:     name,
		Path:     path,
		LastOpen: time.Now(),
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

// CheckForgeProject checks if a directory contains a forge.json file
func (p *ProjectService) CheckForgeProject(path string) (bool, error) {
	forgeJsonPath := filepath.Join(path, "forge.json")
	_, err := os.Stat(forgeJsonPath)
	if os.IsNotExist(err) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
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

// IsGitRepo checks if the given path is a git repository
func (p *ProjectService) IsGitRepo(path string) bool {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return false
	}
	gitDir := filepath.Join(path, ".git")
	_, err := os.Stat(gitDir)
	return err == nil
}

// GetGitBranch returns the current git branch for the given path
func (p *ProjectService) GetGitBranch(path string) string {
	// Check if path exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return ""
	}
	// Check if it's a git repo
	gitDir := filepath.Join(path, ".git")
	if _, err := os.Stat(gitDir); os.IsNotExist(err) {
		return ""
	}
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
	// Check if path exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return []string{}, nil
	}
	// Check if it's a git repo
	gitDir := filepath.Join(path, ".git")
	if _, err := os.Stat(gitDir); os.IsNotExist(err) {
		return []string{}, nil
	}
	cmd := exec.Command("git", "branch", "--format=%(refname:short)")
	cmd.Dir = path
	output, err := cmd.Output()
	if err != nil {
		return []string{}, nil
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

// InitGitRepo initializes a git repository in the given path
func (p *ProjectService) InitGitRepo(path string) error {
	// Check if path exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return err
	}
	// Check if already a git repo
	gitDir := filepath.Join(path, ".git")
	if _, err := os.Stat(gitDir); err == nil {
		return nil // Already initialized
	}
	cmd := exec.Command("git", "init")
	cmd.Dir = path
	return cmd.Run()
}

// CreateGitBranch creates a new git branch and switches to it
func (p *ProjectService) CreateGitBranch(path string, branchName string) error {
	// Check if path exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return err
	}
	// Check if it's a git repo
	gitDir := filepath.Join(path, ".git")
	if _, err := os.Stat(gitDir); os.IsNotExist(err) {
		return err
	}
	cmd := exec.Command("git", "checkout", "-b", branchName)
	cmd.Dir = path
	return cmd.Run()
}

// RemoveProject removes a project from the recent projects list (does not delete files)
func (p *ProjectService) RemoveProject(path string) error {
	return p.removeFromRecentProjects(path)
}

// DeleteProject deletes a project folder (moves to trash on macOS) and removes from recent list
func (p *ProjectService) DeleteProject(path string) error {
	// First check if path exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		// Path doesn't exist, just remove from recent list
		return p.removeFromRecentProjects(path)
	}

	// Move to trash using macOS Finder (safer than permanent delete)
	script := fmt.Sprintf(`tell application "Finder" to delete POSIX file "%s"`, path)
	cmd := exec.Command("osascript", "-e", script)
	if err := cmd.Run(); err != nil {
		// Fallback to permanent delete if trash fails
		if err := os.RemoveAll(path); err != nil {
			return err
		}
	}

	// Remove from recent projects list
	return p.removeFromRecentProjects(path)
}

// removeFromRecentProjects removes a project path from the recent projects list
func (p *ProjectService) removeFromRecentProjects(path string) error {
	forgeDir := filepath.Join(os.Getenv("HOME"), ".forge")
	recentPath := filepath.Join(forgeDir, "recent_projects.json")

	data, err := os.ReadFile(recentPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil // Nothing to remove
		}
		return err
	}

	var projects []Project
	if err := json.Unmarshal(data, &projects); err != nil {
		return err
	}

	// Filter out the project with matching path
	filtered := make([]Project, 0)
	for _, proj := range projects {
		if proj.Path != path {
			filtered = append(filtered, proj)
		}
	}

	// Save the filtered list
	cleanedData, err := json.MarshalIndent(filtered, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(recentPath, cleanedData, 0644)
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
