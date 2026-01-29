import { TestBed } from '@angular/core/testing';
import { NodeMetadataService } from './node-metadata.service';
import {
  ArchitectureNodeType,
  ServiceNode,
  AppNode,
  LibraryNode,
} from '../../features/architecture/models/architecture-node.model';

describe('NodeMetadataService', () => {
  let service: NodeMetadataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NodeMetadataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMetadata', () => {
    it('should return metadata for service type', () => {
      const metadata = service.getMetadata('service');
      expect(metadata).toEqual({
        type: 'service',
        label: 'Service',
        labelShort: 'S',
        icon: 'lucideServer',
        description: 'Backend microservice',
        defaultRootPath: 'backend/services',
      });
    });

    it('should return metadata for app type', () => {
      const metadata = service.getMetadata('app');
      expect(metadata).toEqual({
        type: 'app',
        label: 'Application',
        labelShort: 'A',
        icon: 'lucideMonitor',
        description: 'Frontend application',
        defaultRootPath: 'frontend/apps',
      });
    });

    it('should return metadata for library type', () => {
      const metadata = service.getMetadata('library');
      expect(metadata).toEqual({
        type: 'library',
        label: 'Library',
        labelShort: 'L',
        icon: 'lucidePackage',
        description: 'Shared code library',
        defaultRootPath: 'shared',
      });
    });
  });

  describe('getLabel', () => {
    it.each<[ArchitectureNodeType, string]>([
      ['service', 'Service'],
      ['app', 'Application'],
      ['library', 'Library'],
    ])('should return "%s" for type %s', (type, expected) => {
      expect(service.getLabel(type)).toBe(expected);
    });
  });

  describe('getLabelShort', () => {
    it.each<[ArchitectureNodeType, string]>([
      ['service', 'S'],
      ['app', 'A'],
      ['library', 'L'],
    ])('should return "%s" for type %s', (type, expected) => {
      expect(service.getLabelShort(type)).toBe(expected);
    });
  });

  describe('getIcon', () => {
    it.each<[ArchitectureNodeType, string]>([
      ['service', 'lucideServer'],
      ['app', 'lucideMonitor'],
      ['library', 'lucidePackage'],
    ])('should return "%s" for type %s', (type, expected) => {
      expect(service.getIcon(type)).toBe(expected);
    });
  });

  describe('generateRootPath', () => {
    it('should generate correct path for service', () => {
      expect(service.generateRootPath('service', 'user-api')).toBe(
        'backend/services/user-api',
      );
    });

    it('should generate correct path for app', () => {
      expect(service.generateRootPath('app', 'dashboard')).toBe(
        'frontend/apps/dashboard',
      );
    });

    it('should generate correct path for library', () => {
      expect(service.generateRootPath('library', 'utils')).toBe('shared/utils');
    });

    it('should convert name to kebab-case', () => {
      expect(service.generateRootPath('service', 'User API')).toBe(
        'backend/services/user-api',
      );
    });
  });

  describe('getBadgeText', () => {
    it('should return language label for service node', () => {
      const node: ServiceNode = {
        id: '1',
        name: 'test',
        type: 'service',
        language: 'go',
        deployer: 'helm',
        positionX: 0,
        positionY: 0,
      };
      expect(service.getBadgeText(node)).toBe('Go');
    });

    it('should return framework label for app node', () => {
      const node: AppNode = {
        id: '1',
        name: 'test',
        type: 'app',
        framework: 'angular',
        deployer: 'firebase',
        positionX: 0,
        positionY: 0,
      };
      expect(service.getBadgeText(node)).toBe('Angular');
    });

    it('should return language label for library node', () => {
      const node: LibraryNode = {
        id: '1',
        name: 'test',
        type: 'library',
        language: 'typescript',
        positionX: 0,
        positionY: 0,
      };
      expect(service.getBadgeText(node)).toBe('TypeScript');
    });
  });

  describe('getServiceLanguageLabel', () => {
    it.each<[ServiceNode['language'], string]>([
      ['go', 'Go'],
      ['nestjs', 'NestJS'],
    ])('should return "%s" for language %s', (language, expected) => {
      expect(service.getServiceLanguageLabel(language)).toBe(expected);
    });
  });

  describe('getAppFrameworkLabel', () => {
    it.each<[AppNode['framework'], string]>([
      ['angular', 'Angular'],
      ['react', 'React'],
      ['vue', 'Vue'],
    ])('should return "%s" for framework %s', (framework, expected) => {
      expect(service.getAppFrameworkLabel(framework)).toBe(expected);
    });
  });

  describe('getLibraryLanguageLabel', () => {
    it.each<[LibraryNode['language'], string]>([
      ['go', 'Go'],
      ['typescript', 'TypeScript'],
    ])('should return "%s" for language %s', (language, expected) => {
      expect(service.getLibraryLanguageLabel(language)).toBe(expected);
    });
  });

  describe('getDeployerLabel', () => {
    it.each<[string, string]>([
      ['helm', 'Helm/GKE'],
      ['cloudrun', 'Cloud Run'],
      ['firebase', 'Firebase'],
      ['gke', 'GKE'],
    ])('should return "%s" for deployer %s', (deployer, expected) => {
      expect(service.getDeployerLabel(deployer as any)).toBe(expected);
    });
  });

  describe('getAllTypes', () => {
    it('should return all node types', () => {
      expect(service.getAllTypes()).toEqual(['service', 'app', 'library']);
    });
  });

  describe('getAllMetadata', () => {
    it('should return metadata for all types', () => {
      const allMetadata = service.getAllMetadata();
      expect(allMetadata).toHaveLength(3);
      expect(allMetadata.map((m) => m.type)).toEqual([
        'service',
        'app',
        'library',
      ]);
    });
  });
});
