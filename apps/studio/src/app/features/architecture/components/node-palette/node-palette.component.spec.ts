import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NodePaletteComponent } from './node-palette.component';

describe('NodePaletteComponent', () => {
  let component: NodePaletteComponent;
  let fixture: ComponentFixture<NodePaletteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodePaletteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NodePaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have three palette items', () => {
    expect(component['paletteItems']().length).toBe(3);
  });

  it('should emit addNode when onAddNode is called', () => {
    const spy = jest.spyOn(component.addNode, 'emit');
    component['onAddNode']('service');
    expect(spy).toHaveBeenCalledWith('service');
  });

  it('should return false from noReturnPredicate', () => {
    expect(component.noReturnPredicate()).toBe(false);
  });
});
