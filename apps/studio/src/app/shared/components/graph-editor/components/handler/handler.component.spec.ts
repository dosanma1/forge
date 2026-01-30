import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HandlerComponent } from './handler.component';

describe('HandlerComponent', () => {
  let component: HandlerComponent;
  let fixture: ComponentFixture<HandlerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandlerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HandlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('inputs', () => {
    it('should default x to 0', () => {
      expect(component.x()).toBe(0);
    });

    it('should default y to 0', () => {
      expect(component.y()).toBe(0);
    });
  });

  describe('templateRef', () => {
    it('should have a template ref', () => {
      expect(component.templateRef).toBeDefined();
    });
  });
});
