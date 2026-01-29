import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransportActionComponent } from './transport-action.component';

describe('TransportActionComponent', () => {
  let component: TransportActionComponent;
  let fixture: ComponentFixture<TransportActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransportActionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TransportActionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('type', 'http');
    fixture.componentRef.setInput('label', 'HTTP');
    fixture.componentRef.setInput('icon', 'lucideGlobe');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit add event on click when not disabled', () => {
    const addSpy = jest.spyOn(component.add, 'emit');
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(addSpy).toHaveBeenCalledWith('http');
  });

  it('should not emit add event when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const addSpy = jest.spyOn(component.add, 'emit');
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(addSpy).not.toHaveBeenCalled();
  });
});
