import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  TransportConfigPanelComponent,
  TransportConfigPanelData,
  ViewportData,
} from './transport-config-panel.component';

describe('TransportConfigPanelComponent', () => {
  let component: TransportConfigPanelComponent;
  let fixture: ComponentFixture<TransportConfigPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransportConfigPanelComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TransportConfigPanelComponent);
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

    it('should have default viewport', () => {
      expect(component.viewport()).toEqual({ x: 0, y: 0, zoom: 1 });
    });
  });

  describe('panelPosition', () => {
    it('should return 0,0 when data is null', () => {
      expect(component['panelPosition']()).toEqual({ x: 0, y: 0 });
    });

    it('should calculate position based on node position', () => {
      const data: TransportConfigPanelData = {
        nodeId: '1',
        nodeName: 'test',
        transport: { type: 'http', id: 't1', basePath: '/', version: 'v1', endpoints: [] },
        position: { x: 100, y: 100 },
      };
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();

      const position = component['panelPosition']();
      expect(position.x).toBe(400); // 100 + 260 + 40
      expect(position.y).toBe(100);
    });
  });

  describe('getMethodClass', () => {
    it('should return emerald classes for GET', () => {
      expect(component['getMethodClass']('GET')).toContain('emerald');
    });

    it('should return blue classes for POST', () => {
      expect(component['getMethodClass']('POST')).toContain('blue');
    });

    it('should return amber classes for PUT', () => {
      expect(component['getMethodClass']('PUT')).toContain('amber');
    });

    it('should return amber classes for PATCH', () => {
      expect(component['getMethodClass']('PATCH')).toContain('amber');
    });

    it('should return red classes for DELETE', () => {
      expect(component['getMethodClass']('DELETE')).toContain('red');
    });
  });

  describe('events', () => {
    it('should emit close when onClose is called', () => {
      const spy = jest.spyOn(component.close, 'emit');
      component['onClose']();
      expect(spy).toHaveBeenCalled();
    });

    it('should emit basePathChange when base path changes', () => {
      const data: TransportConfigPanelData = {
        nodeId: '1',
        nodeName: 'test',
        transport: { type: 'http', id: 't1', basePath: '/', version: 'v1', endpoints: [] },
        position: { x: 0, y: 0 },
      };
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();

      const spy = jest.spyOn(component.basePathChange, 'emit');
      component['onBasePathChange']('/api');
      expect(spy).toHaveBeenCalledWith({
        nodeId: '1',
        transportId: 't1',
        basePath: '/api',
      });
    });
  });
});
