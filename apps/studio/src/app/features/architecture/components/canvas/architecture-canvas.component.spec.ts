import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArchitectureCanvasComponent } from './architecture-canvas.component';

describe('ArchitectureCanvasComponent', () => {
  let component: ArchitectureCanvasComponent;
  let fixture: ComponentFixture<ArchitectureCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchitectureCanvasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ArchitectureCanvasComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('graphNodes', []);
    fixture.componentRef.setInput('graphEdges', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit nodeSelected when graph editor emits', () => {
    const selectSpy = jest.spyOn(component.nodeSelected, 'emit');
    component['onNodeSelected']('node-1');
    expect(selectSpy).toHaveBeenCalledWith('node-1');
  });

  it('should emit nodeDrop when graph editor emits', () => {
    const dropSpy = jest.spyOn(component.nodeDrop, 'emit');
    const event = { type: 'service', position: { x: 100, y: 200 } };
    component['onNodeDrop'](event);
    expect(dropSpy).toHaveBeenCalledWith(event);
  });

  it('should not show config panel when configPanelData is null', () => {
    fixture.componentRef.setInput('configPanelData', null);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('app-node-config-panel');
    expect(panel).toBeFalsy();
  });
});
