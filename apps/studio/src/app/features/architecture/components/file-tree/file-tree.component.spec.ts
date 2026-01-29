import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileTreeComponent } from './file-tree.component';

describe('FileTreeComponent', () => {
  let component: FileTreeComponent;
  let fixture: ComponentFixture<FileTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileTreeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FileTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('inputs', () => {
    it('should default directoryPath to null', () => {
      expect(component.directoryPath()).toBeNull();
    });

    it('should default hotReloadEnabled to false', () => {
      expect(component.hotReloadEnabled()).toBe(false);
    });

    it('should default hotReloadInterval to 10000', () => {
      expect(component.hotReloadInterval()).toBe(10000);
    });
  });

  describe('initial state', () => {
    it('should show no files found when treeData is empty', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No files found');
    });

    it('should not be loading initially', () => {
      expect(component['isLoading']()).toBe(false);
    });
  });

  describe('getIcon', () => {
    it('should return folder icon for directory', () => {
      const icon = component['getIcon']({
        name: 'test',
        path: 'test',
        type: 'directory',
      });
      expect(icon).toBe('lucideFolder');
    });

    it('should return code icon for ts files', () => {
      const icon = component['getIcon']({
        name: 'test.ts',
        path: 'test.ts',
        type: 'file',
      });
      expect(icon).toBe('lucideFileCode');
    });

    it('should return json icon for json files', () => {
      const icon = component['getIcon']({
        name: 'package.json',
        path: 'package.json',
        type: 'file',
      });
      expect(icon).toBe('lucideFileJson');
    });

    it('should return text icon for md files', () => {
      const icon = component['getIcon']({
        name: 'README.md',
        path: 'README.md',
        type: 'file',
      });
      expect(icon).toBe('lucideFileText');
    });

    it('should return image icon for png files', () => {
      const icon = component['getIcon']({
        name: 'logo.png',
        path: 'logo.png',
        type: 'file',
      });
      expect(icon).toBe('lucideImage');
    });

    it('should return default file icon for unknown extensions', () => {
      const icon = component['getIcon']({
        name: 'file.unknown',
        path: 'file.unknown',
        type: 'file',
      });
      expect(icon).toBe('lucideFile');
    });
  });
});
