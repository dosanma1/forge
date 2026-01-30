import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BottomPanelComponent } from './bottom-panel.component';

describe('BottomPanelComponent', () => {
  let component: BottomPanelComponent;
  let fixture: ComponentFixture<BottomPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BottomPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('nodes', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty message when no nodes', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('No nodes');
  });

  it('should display nodes when provided', () => {
    fixture.componentRef.setInput('nodes', [
      { id: '1', type: 'service', name: 'test-service', root: '/services/test' },
    ]);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('test-service');
  });

  it('should emit selectNode when node is clicked', () => {
    const selectSpy = jest.spyOn(component.selectNode, 'emit');
    fixture.componentRef.setInput('nodes', [
      { id: '1', type: 'service', name: 'test-service', root: '/services/test' },
    ]);
    fixture.detectChanges();

    const nodeCard = fixture.nativeElement.querySelector('.cursor-pointer');
    nodeCard.click();
    expect(selectSpy).toHaveBeenCalledWith('1');
  });
});
