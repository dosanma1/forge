import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionsPanelComponent } from './actions-panel.component';

describe('ActionsPanelComponent', () => {
  let component: ActionsPanelComponent;
  let fixture: ComponentFixture<ActionsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionsPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show message when no node is selected', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Select a node to see available actions');
  });

  it('should show transport actions when service node is selected', () => {
    fixture.componentRef.setInput('selectedNode', {
      id: '1',
      type: 'service',
      name: 'test-service',
    });
    fixture.detectChanges();
    const actions = fixture.nativeElement.querySelectorAll('app-transport-action');
    expect(actions.length).toBe(3);
  });

  it('should emit addTransport when action is triggered', () => {
    const addSpy = jest.spyOn(component.addTransport, 'emit');
    fixture.componentRef.setInput('selectedNode', {
      id: '1',
      type: 'service',
      name: 'test-service',
    });
    fixture.detectChanges();

    component['onAddTransport']('http');
    expect(addSpy).toHaveBeenCalledWith('http');
  });
});
