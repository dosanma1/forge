import { TestBed } from '@angular/core/testing';
import { NodeStyleService, NodeColorScheme } from './node-style.service';
import { ArchitectureNodeType } from '../../features/architecture/models/architecture-node.model';

describe('NodeStyleService', () => {
  let service: NodeStyleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NodeStyleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getColorScheme', () => {
    it.each<[ArchitectureNodeType, NodeColorScheme]>([
      ['service', 'blue'],
      ['app', 'green'],
      ['library', 'purple'],
    ])('should return %s for node type %s', (type, expected) => {
      expect(service.getColorScheme(type)).toBe(expected);
    });
  });

  describe('getStyles', () => {
    it('should return style config for service', () => {
      const styles = service.getStyles('service');
      expect(styles.bgClass).toContain('blue');
      expect(styles.textClass).toContain('blue');
      expect(styles.borderClass).toContain('blue');
    });

    it('should return style config for app', () => {
      const styles = service.getStyles('app');
      expect(styles.bgClass).toContain('green');
      expect(styles.textClass).toContain('green');
      expect(styles.borderClass).toContain('green');
    });

    it('should return style config for library', () => {
      const styles = service.getStyles('library');
      expect(styles.bgClass).toContain('purple');
      expect(styles.textClass).toContain('purple');
      expect(styles.borderClass).toContain('purple');
    });
  });

  describe('getStylesByScheme', () => {
    it('should return styles for blue scheme', () => {
      const styles = service.getStylesByScheme('blue');
      expect(styles.bgClass).toContain('blue');
    });

    it('should return styles for gray scheme', () => {
      const styles = service.getStylesByScheme('gray');
      expect(styles.bgClass).toContain('muted');
    });
  });

  describe('getHeaderBgClass', () => {
    it('should return combined bg and text classes for service', () => {
      const classes = service.getHeaderBgClass('service');
      expect(classes).toContain('bg-blue');
      expect(classes).toContain('text-blue');
    });

    it('should return combined bg and text classes for app', () => {
      const classes = service.getHeaderBgClass('app');
      expect(classes).toContain('bg-green');
      expect(classes).toContain('text-green');
    });

    it('should return combined bg and text classes for library', () => {
      const classes = service.getHeaderBgClass('library');
      expect(classes).toContain('bg-purple');
      expect(classes).toContain('text-purple');
    });
  });

  describe('getCardHeaderClass', () => {
    it('should include bg, text, and border classes', () => {
      const classes = service.getCardHeaderClass('service');
      expect(classes).toContain('bg-blue');
      expect(classes).toContain('text-blue');
      expect(classes).toContain('border-blue');
    });
  });

  describe('getBadgeClass', () => {
    it('should return badge classes with ring', () => {
      const classes = service.getBadgeClass('service');
      expect(classes).toContain('bg-blue');
      expect(classes).toContain('text-blue');
      expect(classes).toContain('ring-blue');
    });
  });

  describe('getIconClass', () => {
    it.each<[ArchitectureNodeType, string]>([
      ['service', 'text-blue-500'],
      ['app', 'text-green-500'],
      ['library', 'text-purple-500'],
    ])('should return icon class for %s', (type, expected) => {
      expect(service.getIconClass(type)).toBe(expected);
    });
  });

  describe('getNodeColorClass', () => {
    it('should return combined icon, bg, and border classes', () => {
      const classes = service.getNodeColorClass('service');
      expect(classes).toContain('text-blue-500');
      expect(classes).toContain('bg-blue');
      expect(classes).toContain('border-blue');
    });
  });

  describe('getSelectionRingClass', () => {
    it.each<[ArchitectureNodeType, string]>([
      ['service', 'ring-blue-500'],
      ['app', 'ring-green-500'],
      ['library', 'ring-purple-500'],
    ])('should return ring class for %s', (type, expected) => {
      expect(service.getSelectionRingClass(type)).toBe(expected);
    });
  });

  describe('getCardBorderClass', () => {
    it('should return primary border when selected', () => {
      const classes = service.getCardBorderClass('service', true);
      expect(classes).toContain('border-primary');
    });

    it('should return default border when not selected', () => {
      const classes = service.getCardBorderClass('service', false);
      expect(classes).toContain('border-border');
    });
  });

  describe('getCardContainerClass', () => {
    it('should include base classes and border for selected state', () => {
      const classes = service.getCardContainerClass('service', true);
      expect(classes).toContain('rounded-lg');
      expect(classes).toContain('bg-card');
      expect(classes).toContain('shadow-sm');
      expect(classes).toContain('border-primary');
    });

    it('should include base classes and default border for unselected state', () => {
      const classes = service.getCardContainerClass('app', false);
      expect(classes).toContain('rounded-lg');
      expect(classes).toContain('bg-card');
      expect(classes).toContain('border-border');
    });
  });
});
