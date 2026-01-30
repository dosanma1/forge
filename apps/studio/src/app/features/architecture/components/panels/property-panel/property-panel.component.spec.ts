import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { PropertyPanelComponent } from './property-panel.component';
import { ServiceNode, AppNode, LibraryNode } from '../../models/architecture-node.model';

describe('PropertyPanelComponent', () => {
  let component: PropertyPanelComponent;
  let fixture: ComponentFixture<PropertyPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyPanelComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('with no node selected', () => {
    it('should show placeholder message', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Select a node to view its properties');
    });
  });

  describe('with service node', () => {
    const serviceNode: ServiceNode = {
      id: '1',
      name: 'test-service',
      type: 'service',
      language: 'go',
      deployer: 'helm',
      root: 'backend/services/test-service',
      positionX: 0,
      positionY: 0,
    };

    beforeEach(() => {
      fixture.componentRef.setInput('node', serviceNode);
      fixture.detectChanges();
    });

    it('should display service node name', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('test-service');
    });

    it('should return correct icon for service', () => {
      expect(component['nodeIcon']()).toBe('lucideServer');
    });

    it('should return correct type label for service', () => {
      expect(component['nodeTypeLabel']()).toBe('Service');
    });

    it('should identify as service node', () => {
      expect(component['isService'](serviceNode)).toBe(true);
      expect(component['isApp'](serviceNode)).toBe(false);
      expect(component['isLibrary'](serviceNode)).toBe(false);
    });
  });

  describe('with app node', () => {
    const appNode: AppNode = {
      id: '2',
      name: 'test-app',
      type: 'app',
      framework: 'angular',
      deployer: 'firebase',
      root: 'frontend/apps/test-app',
      positionX: 0,
      positionY: 0,
    };

    beforeEach(() => {
      fixture.componentRef.setInput('node', appNode);
      fixture.detectChanges();
    });

    it('should return correct icon for app', () => {
      expect(component['nodeIcon']()).toBe('lucideMonitor');
    });

    it('should return correct type label for app', () => {
      expect(component['nodeTypeLabel']()).toBe('Application');
    });
  });

  describe('with library node', () => {
    const libraryNode: LibraryNode = {
      id: '3',
      name: 'test-lib',
      type: 'library',
      language: 'typescript',
      root: 'shared/test-lib',
      positionX: 0,
      positionY: 0,
    };

    beforeEach(() => {
      fixture.componentRef.setInput('node', libraryNode);
      fixture.detectChanges();
    });

    it('should return correct icon for library', () => {
      expect(component['nodeIcon']()).toBe('lucidePackage');
    });

    it('should return correct type label for library', () => {
      expect(component['nodeTypeLabel']()).toBe('Library');
    });
  });

  describe('events', () => {
    const node: ServiceNode = {
      id: '1',
      name: 'test',
      type: 'service',
      language: 'go',
      deployer: 'helm',
      positionX: 0,
      positionY: 0,
    };

    beforeEach(() => {
      fixture.componentRef.setInput('node', node);
      fixture.detectChanges();
    });

    it('should emit nodeChange when property is updated', () => {
      const spy = jest.spyOn(component.nodeChange, 'emit');
      component['updateProperty']('name', 'new-name');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'new-name' }),
      );
    });

    it('should emit deleteNode when delete is clicked', () => {
      const spy = jest.spyOn(component.deleteNode, 'emit');
      component['onDelete']();
      expect(spy).toHaveBeenCalledWith('1');
    });
  });
});
