import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NodeTagsComponent } from './node-tags.component';

describe('NodeTagsComponent', () => {
  let component: NodeTagsComponent;
  let fixture: ComponentFixture<NodeTagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeTagsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeTagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('inputs', () => {
    it('should default tags to empty array', () => {
      expect(component.tags()).toEqual([]);
    });

    it('should accept tags input', () => {
      fixture.componentRef.setInput('tags', ['backend', 'service']);
      fixture.detectChanges();
      expect(component.tags()).toEqual(['backend', 'service']);
    });

    it('should default maxTags to 0 (unlimited)', () => {
      expect(component.maxTags()).toBe(0);
    });

    it('should accept maxTags input', () => {
      fixture.componentRef.setInput('maxTags', 3);
      fixture.detectChanges();
      expect(component.maxTags()).toBe(3);
    });
  });

  describe('rendering', () => {
    it('should not render anything when tags is empty', () => {
      fixture.componentRef.setInput('tags', []);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.children.length).toBe(0);
    });

    it('should render all tags when provided', () => {
      fixture.componentRef.setInput('tags', ['tag1', 'tag2', 'tag3']);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('tag1');
      expect(compiled.textContent).toContain('tag2');
      expect(compiled.textContent).toContain('tag3');
    });

    it('should render correct number of tag elements', () => {
      fixture.componentRef.setInput('tags', ['a', 'b', 'c']);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const tags = compiled.querySelectorAll('span');
      expect(tags.length).toBe(3);
    });

    it('should truncate tags when maxTags is set', () => {
      fixture.componentRef.setInput('tags', ['a', 'b', 'c', 'd', 'e']);
      fixture.componentRef.setInput('maxTags', 2);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const tags = compiled.querySelectorAll('span');
      // 2 tags + 1 "+N" indicator
      expect(tags.length).toBe(3);
    });

    it('should show +N indicator when truncated', () => {
      fixture.componentRef.setInput('tags', ['a', 'b', 'c', 'd', 'e']);
      fixture.componentRef.setInput('maxTags', 2);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('+3');
    });

    it('should not show +N indicator when all tags fit', () => {
      fixture.componentRef.setInput('tags', ['a', 'b']);
      fixture.componentRef.setInput('maxTags', 5);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('+');
    });

    it('should apply additional classes', () => {
      fixture.componentRef.setInput('tags', ['test']);
      fixture.componentRef.setInput('additionalClasses', 'my-custom-class');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector('div');
      expect(container?.classList.contains('my-custom-class')).toBe(true);
    });
  });
});
