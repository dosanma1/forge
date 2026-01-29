import { TestBed } from '@angular/core/testing';
import { HttpMethodStyleService } from './http-method-style.service';
import { HttpMethod } from '../../features/architecture/models/architecture-node.model';

describe('HttpMethodStyleService', () => {
  let service: HttpMethodStyleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpMethodStyleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getStyle', () => {
    it('should return style config for GET', () => {
      const style = service.getStyle('GET');
      expect(style.badgeClass).toContain('emerald');
      expect(style.label).toBe('GET');
    });

    it('should return style config for POST', () => {
      const style = service.getStyle('POST');
      expect(style.badgeClass).toContain('blue');
      expect(style.label).toBe('POST');
    });

    it('should return style config for PUT', () => {
      const style = service.getStyle('PUT');
      expect(style.badgeClass).toContain('amber');
      expect(style.label).toBe('PUT');
    });

    it('should return style config for PATCH', () => {
      const style = service.getStyle('PATCH');
      expect(style.badgeClass).toContain('amber');
      expect(style.label).toBe('PATCH');
    });

    it('should return style config for DELETE', () => {
      const style = service.getStyle('DELETE');
      expect(style.badgeClass).toContain('red');
      expect(style.label).toBe('DEL');
      expect(style.labelFull).toBe('DELETE');
    });

    it('should return default style for unknown method', () => {
      const style = service.getStyle('UNKNOWN');
      expect(style.badgeClass).toContain('muted');
      expect(style.label).toBe('?');
    });
  });

  describe('getMethodClass', () => {
    it.each<[HttpMethod, string]>([
      ['GET', 'emerald'],
      ['POST', 'blue'],
      ['PUT', 'amber'],
      ['PATCH', 'amber'],
      ['DELETE', 'red'],
    ])('should return %s-colored class for %s', (method, color) => {
      const classes = service.getMethodClass(method);
      expect(classes).toContain(color);
    });

    it('should return muted class for unknown method', () => {
      const classes = service.getMethodClass('UNKNOWN');
      expect(classes).toContain('muted');
    });
  });

  describe('getLabel', () => {
    it.each<[HttpMethod, string]>([
      ['GET', 'GET'],
      ['POST', 'POST'],
      ['PUT', 'PUT'],
      ['PATCH', 'PATCH'],
      ['DELETE', 'DEL'],
    ])('should return "%s" for %s', (method, expected) => {
      expect(service.getLabel(method)).toBe(expected);
    });
  });

  describe('getLabelFull', () => {
    it.each<[HttpMethod, string]>([
      ['GET', 'GET'],
      ['POST', 'POST'],
      ['PUT', 'PUT'],
      ['PATCH', 'PATCH'],
      ['DELETE', 'DELETE'],
    ])('should return "%s" for %s', (method, expected) => {
      expect(service.getLabelFull(method)).toBe(expected);
    });
  });

  describe('getAllMethods', () => {
    it('should return all HTTP methods', () => {
      expect(service.getAllMethods()).toEqual([
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
      ]);
    });
  });

  describe('isReadMethod', () => {
    it('should return true for GET', () => {
      expect(service.isReadMethod('GET')).toBe(true);
    });

    it('should return false for POST', () => {
      expect(service.isReadMethod('POST')).toBe(false);
    });

    it('should return false for DELETE', () => {
      expect(service.isReadMethod('DELETE')).toBe(false);
    });
  });

  describe('isWriteMethod', () => {
    it.each<[string, boolean]>([
      ['GET', false],
      ['POST', true],
      ['PUT', true],
      ['PATCH', true],
      ['DELETE', true],
    ])('should return %s for %s', (method, expected) => {
      expect(service.isWriteMethod(method)).toBe(expected);
    });
  });

  describe('isDestructiveMethod', () => {
    it('should return true for DELETE', () => {
      expect(service.isDestructiveMethod('DELETE')).toBe(true);
    });

    it('should return false for POST', () => {
      expect(service.isDestructiveMethod('POST')).toBe(false);
    });

    it('should return false for GET', () => {
      expect(service.isDestructiveMethod('GET')).toBe(false);
    });
  });

  describe('getMethodsByType', () => {
    it('should return methods grouped by type', () => {
      const groups = service.getMethodsByType();
      expect(groups.read).toEqual(['GET']);
      expect(groups.write).toEqual(['POST', 'PUT', 'PATCH']);
      expect(groups.destructive).toEqual(['DELETE']);
    });
  });
});
