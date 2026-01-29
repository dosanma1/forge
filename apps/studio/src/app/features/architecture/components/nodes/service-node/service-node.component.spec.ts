import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceNodeComponent } from './service-node.component';
import { TransportEditorService } from '../../../services/transport-editor.service';

describe('ServiceNodeComponent', () => {
  let component: ServiceNodeComponent;
  let fixture: ComponentFixture<ServiceNodeComponent>;
  let mockTransportEditorService: jest.Mocked<TransportEditorService>;

  beforeEach(async () => {
    mockTransportEditorService = {
      isSelected: jest.fn().mockReturnValue(false),
      selectTransport: jest.fn(),
    } as unknown as jest.Mocked<TransportEditorService>;

    await TestBed.configureTestingModule({
      imports: [ServiceNodeComponent],
      providers: [
        { provide: TransportEditorService, useValue: mockTransportEditorService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceNodeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getLanguageBadge', () => {
    it('should return Go for go language', () => {
      fixture.componentRef.setInput('node', { language: 'go' });
      fixture.detectChanges();
      expect(component['getLanguageBadge']()).toBe('Go');
    });

    it('should return NestJS for nestjs language', () => {
      fixture.componentRef.setInput('node', { language: 'nestjs' });
      fixture.detectChanges();
      expect(component['getLanguageBadge']()).toBe('NestJS');
    });
  });

  describe('getDeployerLabel', () => {
    it('should return Helm/GKE for helm deployer', () => {
      fixture.componentRef.setInput('node', { deployer: 'helm' });
      fixture.detectChanges();
      expect(component['getDeployerLabel']()).toBe('Helm/GKE');
    });

    it('should return Cloud Run for cloudrun deployer', () => {
      fixture.componentRef.setInput('node', { deployer: 'cloudrun' });
      fixture.detectChanges();
      expect(component['getDeployerLabel']()).toBe('Cloud Run');
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

    it('should return muted classes for unknown method', () => {
      expect(component['getMethodClass']('UNKNOWN')).toContain('muted');
    });
  });

  describe('httpTransports', () => {
    it('should filter only http transports', () => {
      fixture.componentRef.setInput('node', {
        transports: [
          { type: 'http', id: '1' },
          { type: 'grpc', id: '2' },
          { type: 'http', id: '3' },
        ],
      });
      fixture.detectChanges();
      expect(component['httpTransports']().length).toBe(2);
    });

    it('should return empty array when no transports', () => {
      fixture.componentRef.setInput('node', { transports: [] });
      fixture.detectChanges();
      expect(component['httpTransports']().length).toBe(0);
    });
  });

  describe('hasTransports', () => {
    it('should return true when transports exist', () => {
      fixture.componentRef.setInput('node', {
        transports: [{ type: 'http', id: '1' }],
      });
      fixture.detectChanges();
      expect(component['hasTransports']()).toBe(true);
    });

    it('should return false when no transports', () => {
      fixture.componentRef.setInput('node', { transports: [] });
      fixture.detectChanges();
      expect(component['hasTransports']()).toBe(false);
    });
  });

  describe('isTransportSelected', () => {
    it('should delegate to transport editor service', () => {
      fixture.componentRef.setInput('node', { id: 'node-1' });
      fixture.detectChanges();
      mockTransportEditorService.isSelected.mockReturnValue(true);
      expect(component['isTransportSelected']('transport-1')).toBe(true);
      expect(mockTransportEditorService.isSelected).toHaveBeenCalledWith('node-1', 'transport-1');
    });

    it('should return false when no node data', () => {
      fixture.detectChanges();
      expect(component['isTransportSelected']('transport-1')).toBe(false);
    });
  });

  describe('classNames', () => {
    it('should include contents class by default', () => {
      fixture.detectChanges();
      expect(component['classNames']()).toContain('contents');
    });
  });
});
