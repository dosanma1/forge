import { TestBed } from '@angular/core/testing';
import { ViewportService, ViewportData, Position } from './viewport.service';

describe('ViewportService', () => {
  let service: ViewportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViewportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have default viewport values', () => {
      expect(service.viewport()).toEqual({ x: 0, y: 0, zoom: 1 });
    });

    it('should have zoom of 1', () => {
      expect(service.zoom()).toBe(1);
    });

    it('should have offset of 0,0', () => {
      expect(service.offset()).toEqual({ x: 0, y: 0 });
    });
  });

  describe('updateViewport', () => {
    it('should update the viewport state', () => {
      const newViewport: ViewportData = { x: 100, y: 200, zoom: 1.5 };
      service.updateViewport(newViewport);
      expect(service.viewport()).toEqual(newViewport);
    });
  });

  describe('updateZoom', () => {
    it('should update only the zoom level', () => {
      service.updateViewport({ x: 50, y: 50, zoom: 1 });
      service.updateZoom(2);
      expect(service.viewport()).toEqual({ x: 50, y: 50, zoom: 2 });
    });
  });

  describe('updateOffset', () => {
    it('should update only the pan offset', () => {
      service.updateViewport({ x: 0, y: 0, zoom: 1.5 });
      service.updateOffset(100, 200);
      expect(service.viewport()).toEqual({ x: 100, y: 200, zoom: 1.5 });
    });
  });

  describe('flowToScreen', () => {
    it('should convert flow coordinates to screen with no zoom/pan', () => {
      const viewport: ViewportData = { x: 0, y: 0, zoom: 1 };
      const flowPos: Position = { x: 100, y: 200 };
      expect(service.flowToScreen(flowPos, viewport)).toEqual({
        x: 100,
        y: 200,
      });
    });

    it('should account for zoom', () => {
      const viewport: ViewportData = { x: 0, y: 0, zoom: 2 };
      const flowPos: Position = { x: 100, y: 200 };
      expect(service.flowToScreen(flowPos, viewport)).toEqual({
        x: 200,
        y: 400,
      });
    });

    it('should account for pan offset', () => {
      const viewport: ViewportData = { x: 50, y: 100, zoom: 1 };
      const flowPos: Position = { x: 100, y: 200 };
      expect(service.flowToScreen(flowPos, viewport)).toEqual({
        x: 150,
        y: 300,
      });
    });

    it('should account for both zoom and pan', () => {
      const viewport: ViewportData = { x: 50, y: 100, zoom: 2 };
      const flowPos: Position = { x: 100, y: 200 };
      // (100 * 2) + 50 = 250, (200 * 2) + 100 = 500
      expect(service.flowToScreen(flowPos, viewport)).toEqual({
        x: 250,
        y: 500,
      });
    });

    it('should use current viewport when not provided', () => {
      service.updateViewport({ x: 10, y: 20, zoom: 1 });
      const flowPos: Position = { x: 100, y: 200 };
      expect(service.flowToScreen(flowPos)).toEqual({ x: 110, y: 220 });
    });
  });

  describe('screenToFlow', () => {
    it('should convert screen coordinates to flow with no zoom/pan', () => {
      const viewport: ViewportData = { x: 0, y: 0, zoom: 1 };
      const screenPos: Position = { x: 100, y: 200 };
      expect(service.screenToFlow(screenPos, viewport)).toEqual({
        x: 100,
        y: 200,
      });
    });

    it('should account for zoom', () => {
      const viewport: ViewportData = { x: 0, y: 0, zoom: 2 };
      const screenPos: Position = { x: 200, y: 400 };
      expect(service.screenToFlow(screenPos, viewport)).toEqual({
        x: 100,
        y: 200,
      });
    });

    it('should account for pan offset', () => {
      const viewport: ViewportData = { x: 50, y: 100, zoom: 1 };
      const screenPos: Position = { x: 150, y: 300 };
      expect(service.screenToFlow(screenPos, viewport)).toEqual({
        x: 100,
        y: 200,
      });
    });

    it('should be inverse of flowToScreen', () => {
      const viewport: ViewportData = { x: 50, y: 100, zoom: 2 };
      const original: Position = { x: 100, y: 200 };
      const screen = service.flowToScreen(original, viewport);
      const backToFlow = service.screenToFlow(screen, viewport);
      expect(backToFlow).toEqual(original);
    });
  });

  describe('calculatePanelPosition', () => {
    it('should calculate panel position to the right of element', () => {
      const viewport: ViewportData = { x: 0, y: 0, zoom: 1 };
      const flowPos: Position = { x: 100, y: 100 };
      const result = service.calculatePanelPosition(flowPos, viewport, {
        elementWidth: 260,
        gap: 40,
        side: 'right',
      });
      // 100 + 260 + 40 = 400
      expect(result.x).toBe(400);
      expect(result.y).toBe(100);
    });

    it('should apply zoom to panel position', () => {
      const viewport: ViewportData = { x: 0, y: 0, zoom: 2 };
      const flowPos: Position = { x: 100, y: 100 };
      const result = service.calculatePanelPosition(flowPos, viewport, {
        elementWidth: 260,
        gap: 40,
        side: 'right',
      });
      // (100 + 260 + 40) * 2 = 800
      expect(result.x).toBe(800);
      expect(result.y).toBe(200);
    });

    it('should apply pan offset to panel position', () => {
      const viewport: ViewportData = { x: 50, y: 100, zoom: 1 };
      const flowPos: Position = { x: 100, y: 100 };
      const result = service.calculatePanelPosition(flowPos, viewport, {
        elementWidth: 260,
        gap: 40,
        side: 'right',
      });
      // 400 + 50 = 450
      expect(result.x).toBe(450);
      expect(result.y).toBe(200);
    });

    it('should use default values when config not provided', () => {
      const viewport: ViewportData = { x: 0, y: 0, zoom: 1 };
      const flowPos: Position = { x: 100, y: 100 };
      const result = service.calculatePanelPosition(flowPos, viewport);
      // 100 + 260 (default) + 40 (default) = 400
      expect(result.x).toBe(400);
      expect(result.y).toBe(100);
    });

    it('should calculate panel position to the left of element', () => {
      const viewport: ViewportData = { x: 0, y: 0, zoom: 1 };
      const flowPos: Position = { x: 500, y: 100 };
      const result = service.calculatePanelPosition(flowPos, viewport, {
        gap: 40,
        panelWidth: 288,
        side: 'left',
      });
      // 500 - 40 - 288 = 172
      expect(result.x).toBe(172);
      expect(result.y).toBe(100);
    });
  });

  describe('static methods', () => {
    describe('createDefault', () => {
      it('should create default viewport data', () => {
        expect(ViewportService.createDefault()).toEqual({
          x: 0,
          y: 0,
          zoom: 1,
        });
      });
    });

    describe('areEqual', () => {
      it('should return true for equal viewports', () => {
        const a: ViewportData = { x: 100, y: 200, zoom: 1.5 };
        const b: ViewportData = { x: 100, y: 200, zoom: 1.5 };
        expect(ViewportService.isEqual(a, b)).toBe(true);
      });

      it('should return false for different x', () => {
        const a: ViewportData = { x: 100, y: 200, zoom: 1.5 };
        const b: ViewportData = { x: 101, y: 200, zoom: 1.5 };
        expect(ViewportService.isEqual(a, b)).toBe(false);
      });

      it('should return false for different y', () => {
        const a: ViewportData = { x: 100, y: 200, zoom: 1.5 };
        const b: ViewportData = { x: 100, y: 201, zoom: 1.5 };
        expect(ViewportService.isEqual(a, b)).toBe(false);
      });

      it('should return false for different zoom', () => {
        const a: ViewportData = { x: 100, y: 200, zoom: 1.5 };
        const b: ViewportData = { x: 100, y: 200, zoom: 2 };
        expect(ViewportService.isEqual(a, b)).toBe(false);
      });
    });
  });
});
