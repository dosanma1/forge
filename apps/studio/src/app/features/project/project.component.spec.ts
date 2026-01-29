import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectComponent } from './project.component';
import { ProjectService } from './project.service';
import { signal } from '@angular/core';

describe('ProjectComponent', () => {
  let component: ProjectComponent;
  let fixture: ComponentFixture<ProjectComponent>;
  let mockProjectService: Partial<ProjectService>;

  beforeEach(async () => {
    mockProjectService = {
      list: jest.fn(),
      projects: signal([]),
      openOrCreateProject: jest.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectComponent],
      providers: [
        { provide: ProjectService, useValue: mockProjectService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call projectService.list()', () => {
      expect(mockProjectService.list).toHaveBeenCalled();
    });
  });

  describe('openFolder', () => {
    it('should call openOrCreateProject', async () => {
      await component.openFolder();
      expect(mockProjectService.openOrCreateProject).toHaveBeenCalled();
    });
  });

  describe('projectsDataSource', () => {
    it('should return data source with projects', () => {
      const dataSource = component['projectsDataSource']();
      expect(dataSource).toBeDefined();
      expect(dataSource.data).toEqual([]);
      expect(dataSource.totalCount).toBe(0);
    });
  });

  describe('columns', () => {
    it('should have defined columns', () => {
      const columns = component['columns']();
      expect(columns.length).toBe(4);
      expect(columns[0].id).toBe('avatar');
      expect(columns[1].header).toBe('Name');
      expect(columns[2].header).toBe('Description');
      expect(columns[3].id).toBe('actions');
    });
  });
});
