import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LibraryNodeComponent } from './library-node.component';

describe('LibraryNodeComponent', () => {
  let component: LibraryNodeComponent;
  let fixture: ComponentFixture<LibraryNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryNodeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LibraryNodeComponent);
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

    it('should return TypeScript for typescript language', () => {
      fixture.componentRef.setInput('node', { language: 'typescript' });
      fixture.detectChanges();
      expect(component['getLanguageBadge']()).toBe('TypeScript');
    });

    it('should return TypeScript for any non-go language', () => {
      fixture.componentRef.setInput('node', { language: undefined });
      fixture.detectChanges();
      expect(component['getLanguageBadge']()).toBe('TypeScript');
    });
  });

  describe('classNames', () => {
    it('should include contents class by default', () => {
      fixture.detectChanges();
      expect(component['classNames']()).toContain('contents');
    });

    it('should merge additional classes', () => {
      fixture.componentRef.setInput('class', 'custom-class');
      fixture.detectChanges();
      const classes = component['classNames']();
      expect(classes).toContain('contents');
      expect(classes).toContain('custom-class');
    });
  });
});
