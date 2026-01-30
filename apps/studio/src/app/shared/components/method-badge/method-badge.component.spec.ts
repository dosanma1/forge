import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MethodBadgeComponent } from './method-badge.component';
import { HttpMethodStyleService } from '../../services/http-method-style.service';

describe('MethodBadgeComponent', () => {
  let component: MethodBadgeComponent;
  let fixture: ComponentFixture<MethodBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MethodBadgeComponent],
      providers: [HttpMethodStyleService],
    }).compileComponents();

    fixture = TestBed.createComponent(MethodBadgeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('method', 'GET');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('inputs', () => {
    it('should accept method input', () => {
      fixture.componentRef.setInput('method', 'POST');
      fixture.detectChanges();
      expect(component.method()).toBe('POST');
    });

    it('should default showFullLabel to false', () => {
      expect(component.showFullLabel()).toBe(false);
    });

    it('should accept showFullLabel input', () => {
      fixture.componentRef.setInput('showFullLabel', true);
      fixture.detectChanges();
      expect(component.showFullLabel()).toBe(true);
    });

    it('should default size to sm', () => {
      expect(component.size()).toBe('sm');
    });

    it('should accept size input', () => {
      fixture.componentRef.setInput('size', 'md');
      fixture.detectChanges();
      expect(component.size()).toBe('md');
    });
  });

  describe('computed properties', () => {
    it('should compute emerald classes for GET', () => {
      fixture.componentRef.setInput('method', 'GET');
      fixture.detectChanges();
      expect(component['badgeClasses']()).toContain('emerald');
    });

    it('should compute blue classes for POST', () => {
      fixture.componentRef.setInput('method', 'POST');
      fixture.detectChanges();
      expect(component['badgeClasses']()).toContain('blue');
    });

    it('should compute amber classes for PUT', () => {
      fixture.componentRef.setInput('method', 'PUT');
      fixture.detectChanges();
      expect(component['badgeClasses']()).toContain('amber');
    });

    it('should compute amber classes for PATCH', () => {
      fixture.componentRef.setInput('method', 'PATCH');
      fixture.detectChanges();
      expect(component['badgeClasses']()).toContain('amber');
    });

    it('should compute red classes for DELETE', () => {
      fixture.componentRef.setInput('method', 'DELETE');
      fixture.detectChanges();
      expect(component['badgeClasses']()).toContain('red');
    });

    it('should include sm size classes by default', () => {
      expect(component['badgeClasses']()).toContain('text-[10px]');
    });

    it('should include md size classes when size is md', () => {
      fixture.componentRef.setInput('size', 'md');
      fixture.detectChanges();
      expect(component['badgeClasses']()).toContain('text-xs');
    });

    it('should show short label by default', () => {
      fixture.componentRef.setInput('method', 'DELETE');
      fixture.detectChanges();
      expect(component['label']()).toBe('DEL');
    });

    it('should show full label when showFullLabel is true', () => {
      fixture.componentRef.setInput('method', 'DELETE');
      fixture.componentRef.setInput('showFullLabel', true);
      fixture.detectChanges();
      expect(component['label']()).toBe('DELETE');
    });
  });

  describe('rendering', () => {
    it('should render the method label', () => {
      fixture.componentRef.setInput('method', 'GET');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent?.trim()).toBe('GET');
    });

    it('should render DELETE as DEL by default', () => {
      fixture.componentRef.setInput('method', 'DELETE');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent?.trim()).toBe('DEL');
    });

    it('should render full DELETE label when showFullLabel is true', () => {
      fixture.componentRef.setInput('method', 'DELETE');
      fixture.componentRef.setInput('showFullLabel', true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent?.trim()).toBe('DELETE');
    });

    it('should apply badge classes to span', () => {
      fixture.componentRef.setInput('method', 'GET');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const span = compiled.querySelector('span');
      expect(span?.classList.contains('rounded')).toBe(true);
    });
  });
});
