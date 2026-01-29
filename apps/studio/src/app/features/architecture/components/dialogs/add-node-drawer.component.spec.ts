import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  AddNodeDrawerComponent,
  AddNodeDrawerData,
} from './add-node-drawer.component';
import { MmcDrawerRef, DRAWER_DATA } from '@forge/ui';

describe('AddNodeDrawerComponent', () => {
  let component: AddNodeDrawerComponent;
  let fixture: ComponentFixture<AddNodeDrawerComponent>;
  let mockDrawerRef: jest.Mocked<MmcDrawerRef<any>>;

  const defaultData: AddNodeDrawerData = {
    type: 'service',
    position: { x: 100, y: 200 },
  };

  beforeEach(async () => {
    mockDrawerRef = {
      close: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [AddNodeDrawerComponent, FormsModule],
      providers: [
        { provide: MmcDrawerRef, useValue: mockDrawerRef },
        { provide: DRAWER_DATA, useValue: defaultData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddNodeDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('nodeTypeLabel', () => {
    it('should return Service for service type', () => {
      expect(component['nodeTypeLabel']()).toBe('Service');
    });
  });

  describe('headerIcon', () => {
    it('should return lucideServer for service type', () => {
      expect(component['headerIcon']()).toBe('lucideServer');
    });
  });

  describe('headerColorClass', () => {
    it('should return blue classes for service type', () => {
      expect(component['headerColorClass']()).toContain('blue');
    });
  });

  describe('isValid', () => {
    it('should return false when name is empty', () => {
      expect(component['isValid']()).toBe(false);
    });

    it('should return true when name has content', () => {
      component['name'] = 'test-service';
      expect(component['isValid']()).toBe(true);
    });
  });

  describe('onCancel', () => {
    it('should close drawer without result', () => {
      component['onCancel']();
      expect(mockDrawerRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onSubmit', () => {
    it('should not submit when invalid', () => {
      component['name'] = '';
      component['onSubmit']();
      expect(mockDrawerRef.close).not.toHaveBeenCalled();
    });

    it('should close drawer with node result when valid', () => {
      component['name'] = 'my-service';
      component['onSubmit']();
      expect(mockDrawerRef.close).toHaveBeenCalledWith(
        expect.objectContaining({
          node: expect.objectContaining({
            name: 'my-service',
            type: 'service',
          }),
        }),
      );
    });
  });
});
