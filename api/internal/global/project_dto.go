package global

import (
	"time"

	"github.com/dosanma1/forge/go/kit/resource"
)

const ProjectResourceType resource.Type = "projects"

// ProjectDTO is the JSON API representation of a project
type ProjectDTO struct {
	resource.RestDTO
	PName        string    `jsonapi:"attr,name"`
	PDescription string    `jsonapi:"attr,description,omitempty"`
	PImageURL    string    `jsonapi:"attr,imageURL,omitempty"`
	PPath        string    `jsonapi:"attr,path"`
	PLastOpened  time.Time `jsonapi:"attr,lastOpened,omitempty"`
}

func NewProjectDTO(rp RecentProject) *ProjectDTO {
	return &ProjectDTO{
		RestDTO: resource.RestDTO{
			RID:   rp.Path, // Use path as the ID
			RType: ProjectResourceType,
		},
		PName:        rp.Name,
		PDescription: "",
		PImageURL:    "",
		PPath:        rp.Path,
		PLastOpened:  rp.LastOpened,
	}
}

func (dto *ProjectDTO) Name() string {
	return dto.PName
}

func (dto *ProjectDTO) Description() string {
	return dto.PDescription
}

func (dto *ProjectDTO) ImageURL() string {
	return dto.PImageURL
}

func (dto *ProjectDTO) Path() string {
	return dto.PPath
}

func (dto *ProjectDTO) LastOpened() time.Time {
	return dto.PLastOpened
}

// ProjectListResponse implements jsonapi.ListResponse for projects
type ProjectListResponse struct {
	items []*ProjectDTO
	count int
}

func NewProjectListResponse(projects []RecentProject) *ProjectListResponse {
	dtos := make([]*ProjectDTO, len(projects))
	for i, p := range projects {
		dtos[i] = NewProjectDTO(p)
	}
	return &ProjectListResponse{
		items: dtos,
		count: len(dtos),
	}
}

func (r *ProjectListResponse) Results() []*ProjectDTO {
	return r.items
}

func (r *ProjectListResponse) TotalCount() int {
	return r.count
}
