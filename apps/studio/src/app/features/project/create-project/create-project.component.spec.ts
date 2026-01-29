import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CreateProjectComponent } from './create-project.component';
import { ProjectService } from '../project.service';

describe('CreateProjectComponent', () => {
  let component: CreateProjectComponent;
  let fixture: ComponentFixture<CreateProjectComponent>;
  let mockProjectService: Partial<ProjectService>;
  let mockRouter: Partial<Router>;

  beforeEach(async () => {
    mockProjectService = {
      getSuggestedName: jest.fn().mockReturnValue('test-project'),
      pendingProjectPath: jest.fn().mockReturnValue('/test/path'),
      createFromPendingPath: jest.fn(),
      clearPendingPath: jest.fn(),
    };

    mockRouter = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CreateProjectComponent],
      providers: [
        { provide: ProjectService, useValue: mockProjectService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should patch form with suggested name', () => {
      expect(component.projectForm.get('name')?.value).toBe('test-project');
    });
  });

  describe('services', () => {
    it('should add a service', () => {
      expect(component.services().length).toBe(0);
      component.addService();
      expect(component.services().length).toBe(1);
      expect(component.services()[0].framework).toBe('go');
      expect(component.services()[0].deployer).toBe('helm');
    });

    it('should remove a service', () => {
      component.addService();
      component.addService();
      expect(component.services().length).toBe(2);
      component.removeService(0);
      expect(component.services().length).toBe(1);
    });
  });

  describe('apps', () => {
    it('should add an app', () => {
      expect(component.apps().length).toBe(0);
      component.addApp();
      expect(component.apps().length).toBe(1);
      expect(component.apps()[0].framework).toBe('angular');
      expect(component.apps()[0].deployer).toBe('firebase');
    });

    it('should remove an app', () => {
      component.addApp();
      component.addApp();
      expect(component.apps().length).toBe(2);
      component.removeApp(0);
      expect(component.apps().length).toBe(1);
    });
  });

  describe('libraries', () => {
    it('should add a library', () => {
      expect(component.libraries().length).toBe(0);
      component.addLibrary();
      expect(component.libraries().length).toBe(1);
      expect(component.libraries()[0].language).toBe('go');
    });

    it('should remove a library', () => {
      component.addLibrary();
      component.addLibrary();
      expect(component.libraries().length).toBe(2);
      component.removeLibrary(0);
      expect(component.libraries().length).toBe(1);
    });
  });

  describe('onSubmit', () => {
    it('should not submit if form is invalid', () => {
      component.projectForm.patchValue({ name: '' });
      component.onSubmit();
      expect(mockProjectService.createFromPendingPath).not.toHaveBeenCalled();
    });

    it('should call createFromPendingPath on valid submit', () => {
      component.projectForm.patchValue({ name: 'my-project' });
      component.onSubmit();
      expect(mockProjectService.createFromPendingPath).toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should clear pending path and navigate to projects', () => {
      component.onCancel();
      expect(mockProjectService.clearPendingPath).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/projects']);
    });
  });
});
