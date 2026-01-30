import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  NodeConfigPanelComponent,
  NodeConfigPanelData,
} from './node-config-panel.component';
import { ViewportData } from '../../../../shared/services/viewport.service';
import {
  ServiceNode,
  AppNode,
  LibraryNode,
} from '../../models/architecture-node.model';

describe('NodeConfigPanelComponent', () => {
  let component: NodeConfigPanelComponent;
  let fixture: ComponentFixture<NodeConfigPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeConfigPanelComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeConfigPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('inputs', () => {
    it('should default data to null', () => {
      expect(component.data()).toBeNull();
    });

    it('should accept data input', () => {
      const data: NodeConfigPanelData = {
        type: 'service',
        position: { x: 100, y: 200 },
      };
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();
      expect(component.data()).toEqual(data);
    });

    it('should have default viewport', () => {
      expect(component.viewport()).toEqual({ x: 0, y: 0, zoom: 1 });
    });
  });

  describe('computed properties', () => {
    describe('panelPosition', () => {
      it('should return 0,0 when data is null', () => {
        expect(component['panelPosition']()).toEqual({ x: 0, y: 0 });
      });

      it('should calculate position based on node position and viewport', () => {
        const data: NodeConfigPanelData = {
          type: 'service',
          position: { x: 100, y: 100 },
        };
        const viewport: ViewportData = { x: 0, y: 0, zoom: 1 };
        fixture.componentRef.setInput('data', data);
        fixture.componentRef.setInput('viewport', viewport);
        fixture.detectChanges();

        const position = component['panelPosition']();
        // 100 + 260 (nodeWidth) + 40 (gap) = 400
        expect(position.x).toBe(400);
        expect(position.y).toBe(100);
      });

      it('should apply zoom to position calculation', () => {
        const data: NodeConfigPanelData = {
          type: 'service',
          position: { x: 100, y: 100 },
        };
        const viewport: ViewportData = { x: 0, y: 0, zoom: 2 };
        fixture.componentRef.setInput('data', data);
        fixture.componentRef.setInput('viewport', viewport);
        fixture.detectChanges();

        const position = component['panelPosition']();
        // (100 + 260 + 40) * 2 = 800
        expect(position.x).toBe(800);
        expect(position.y).toBe(200);
      });
    });

    describe('headerTitle', () => {
      it('should return "Add Service" for new service', () => {
        const data: NodeConfigPanelData = {
          type: 'service',
          position: { x: 0, y: 0 },
        };
        fixture.componentRef.setInput('data', data);
        fixture.detectChanges();
        expect(component['headerTitle']()).toBe('Add Service');
      });

      it('should return "Edit Application" for existing app', () => {
        const node: AppNode = {
          id: '1',
          name: 'test',
          type: 'app',
          framework: 'angular',
          deployer: 'firebase',
          positionX: 0,
          positionY: 0,
          state: 'SAVED',
        };
        const data: NodeConfigPanelData = {
          type: 'app',
          position: { x: 0, y: 0 },
          node,
        };
        fixture.componentRef.setInput('data', data);
        fixture.detectChanges();
        expect(component['headerTitle']()).toBe('Edit Application');
      });
    });

    describe('headerIcon', () => {
      it('should return lucideServer for service', () => {
        const data: NodeConfigPanelData = {
          type: 'service',
          position: { x: 0, y: 0 },
        };
        fixture.componentRef.setInput('data', data);
        fixture.detectChanges();
        expect(component['headerIcon']()).toBe('lucideServer');
      });

      it('should return lucideMonitor for app', () => {
        const data: NodeConfigPanelData = {
          type: 'app',
          position: { x: 0, y: 0 },
        };
        fixture.componentRef.setInput('data', data);
        fixture.detectChanges();
        expect(component['headerIcon']()).toBe('lucideMonitor');
      });

      it('should return lucidePackage for library', () => {
        const data: NodeConfigPanelData = {
          type: 'library',
          position: { x: 0, y: 0 },
        };
        fixture.componentRef.setInput('data', data);
        fixture.detectChanges();
        expect(component['headerIcon']()).toBe('lucidePackage');
      });
    });

    describe('headerBgClass', () => {
      it('should return blue classes for service', () => {
        const data: NodeConfigPanelData = {
          type: 'service',
          position: { x: 0, y: 0 },
        };
        fixture.componentRef.setInput('data', data);
        fixture.detectChanges();
        expect(component['headerBgClass']()).toContain('blue');
      });

      it('should return green classes for app', () => {
        const data: NodeConfigPanelData = {
          type: 'app',
          position: { x: 0, y: 0 },
        };
        fixture.componentRef.setInput('data', data);
        fixture.detectChanges();
        expect(component['headerBgClass']()).toContain('green');
      });

      it('should return purple classes for library', () => {
        const data: NodeConfigPanelData = {
          type: 'library',
          position: { x: 0, y: 0 },
        };
        fixture.componentRef.setInput('data', data);
        fixture.detectChanges();
        expect(component['headerBgClass']()).toContain('purple');
      });
    });
  });

  describe('isValid', () => {
    it('should return false when name is empty', () => {
      expect(component['isValid']()).toBe(false);
    });

    it('should return false when name is only whitespace', () => {
      component['name'] = '   ';
      expect(component['isValid']()).toBe(false);
    });

    it('should return true when name has content', () => {
      component['name'] = 'test-service';
      expect(component['isValid']()).toBe(true);
    });
  });

  describe('events', () => {
    it('should emit close event on onClose', () => {
      const spy = jest.spyOn(component.close, 'emit');
      component['onClose']();
      expect(spy).toHaveBeenCalled();
    });

    it('should emit delete event with node id on onDelete', () => {
      const node: ServiceNode = {
        id: 'test-id',
        name: 'test',
        type: 'service',
        language: 'go',
        deployer: 'helm',
        positionX: 0,
        positionY: 0,
      };
      const data: NodeConfigPanelData = {
        type: 'service',
        position: { x: 0, y: 0 },
        node,
      };
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();

      const spy = jest.spyOn(component.delete, 'emit');
      component['onDelete']();
      expect(spy).toHaveBeenCalledWith('test-id');
    });

    it('should emit save event with new node on onSave', () => {
      const data: NodeConfigPanelData = {
        type: 'service',
        position: { x: 100, y: 200 },
      };
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();

      component['name'] = 'new-service';
      const spy = jest.spyOn(component.save, 'emit');
      component['onSave']();

      expect(spy).toHaveBeenCalled();
      const emittedNode = spy.mock.calls[0][0];
      expect(emittedNode.name).toBe('new-service');
      expect(emittedNode.type).toBe('service');
    });
  });
});
