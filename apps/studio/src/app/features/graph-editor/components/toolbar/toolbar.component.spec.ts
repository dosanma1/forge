import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolbarComponent, EToolbarAction } from './toolbar.component';
import { GraphEditorComponent } from '../../graph-editor.component';

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;
  let mockGraphEditor: Partial<GraphEditorComponent>;

  beforeEach(async () => {
    mockGraphEditor = {
      vFlowComponent: jest.fn().mockReturnValue({
        viewport: jest.fn().mockReturnValue({ zoom: 1 }),
      }),
      zoomIn: jest.fn(),
      zoomOut: jest.fn(),
      fitScreen: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ToolbarComponent],
      providers: [
        { provide: GraphEditorComponent, useValue: mockGraphEditor },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('zoom', () => {
    it('should return current zoom level', () => {
      expect(component.zoom).toBe(1);
    });
  });

  describe('onActionClick', () => {
    it('should call zoomIn on ZOOM_IN action', () => {
      component['onActionClick'](EToolbarAction.ZOOM_IN);
      expect(mockGraphEditor.zoomIn).toHaveBeenCalled();
    });

    it('should call zoomOut on ZOOM_OUT action', () => {
      component['onActionClick'](EToolbarAction.ZOOM_OUT);
      expect(mockGraphEditor.zoomOut).toHaveBeenCalled();
    });

    it('should call fitScreen on FIT_TO_SCREEN action', () => {
      component['onActionClick'](EToolbarAction.FIT_TO_SCREEN);
      expect(mockGraphEditor.fitScreen).toHaveBeenCalled();
    });
  });
});
