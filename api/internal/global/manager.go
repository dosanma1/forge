package global

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/dosanma1/forge-cli/pkg/generator"
	"github.com/dosanma1/forge-cli/pkg/workspace"
)

// GlobalManager handles operations when no project is loaded.
type GlobalManager struct {
	mu             sync.RWMutex
	recentProjects []RecentProject
	configPath     string
}

type RecentProject struct {
	Path       string    `json:"path"`
	Name       string    `json:"name"`
	LastOpened time.Time `json:"lastOpened"`
}

func NewGlobalManager() (*GlobalManager, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}
	configPath := filepath.Join(home, ".forge", "recent_projects.json")

	gm := &GlobalManager{
		configPath:     configPath,
		recentProjects: []RecentProject{},
	}
	_ = gm.load_recent() // Ignore error on first load (file might not exist)
	return gm, nil
}

func (m *GlobalManager) ListRecent(ctx context.Context) ([]RecentProject, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.recentProjects, nil
}

func (m *GlobalManager) AddRecent(ctx context.Context, path string) error {
	// Validate path contains forge.json
	config, err := workspace.LoadConfigWithoutProjectValidation(path)
	if err != nil {
		return fmt.Errorf("invalid forge project at %s: %w", path, err)
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// Remove existing entry if present
	filtered := []RecentProject{}
	for _, p := range m.recentProjects {
		if p.Path != path {
			filtered = append(filtered, p)
		}
	}

	// Prepend new entry
	newEntry := RecentProject{
		Path:       path,
		Name:       config.Workspace.Name,
		LastOpened: time.Now(),
	}
	m.recentProjects = append([]RecentProject{newEntry}, filtered...)

	// Cap at 10
	if len(m.recentProjects) > 10 {
		m.recentProjects = m.recentProjects[:10]
	}

	return m.save_recent()
}

func (m *GlobalManager) CreateProject(ctx context.Context, path string, name string) error {
	opts := generator.GeneratorOptions{
		Name:      name,
		OutputDir: path,
	}

	// Use the exposed WorkspaceGenerator
	gen := generator.NewWorkspaceGenerator()
	if err := gen.Generate(ctx, opts); err != nil {
		return err
	}

	return m.AddRecent(ctx, path)
}

func (m *GlobalManager) load_recent() error {
	data, err := os.ReadFile(m.configPath)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, &m.recentProjects)
}

func (m *GlobalManager) save_recent() error {
	if err := os.MkdirAll(filepath.Dir(m.configPath), 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(m.recentProjects, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(m.configPath, data, 0644)
}
