import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppNodeComponent } from './app-node.component';

describe('AppNodeComponent', () => {
  let component: AppNodeComponent;
  let fixture: ComponentFixture<AppNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppNodeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppNodeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getFrameworkBadge', () => {
    it('should return Angular for angular framework', () => {
      fixture.componentRef.setInput('node', { framework: 'angular' });
      fixture.detectChanges();
      expect(component['getFrameworkBadge']()).toBe('Angular');
    });

    it('should return React for react framework', () => {
      fixture.componentRef.setInput('node', { framework: 'react' });
      fixture.detectChanges();
      expect(component['getFrameworkBadge']()).toBe('React');
    });

    it('should return Vue for vue framework', () => {
      fixture.componentRef.setInput('node', { framework: 'vue' });
      fixture.detectChanges();
      expect(component['getFrameworkBadge']()).toBe('Vue');
    });

    it('should return App for unknown framework', () => {
      fixture.componentRef.setInput('node', { framework: undefined });
      fixture.detectChanges();
      expect(component['getFrameworkBadge']()).toBe('App');
    });
  });

  describe('getDeployerLabel', () => {
    it('should return Firebase for firebase deployer', () => {
      fixture.componentRef.setInput('node', { deployer: 'firebase' });
      fixture.detectChanges();
      expect(component['getDeployerLabel']()).toBe('Firebase');
    });

    it('should return Cloud Run for cloudrun deployer', () => {
      fixture.componentRef.setInput('node', { deployer: 'cloudrun' });
      fixture.detectChanges();
      expect(component['getDeployerLabel']()).toBe('Cloud Run');
    });

    it('should return GKE for gke deployer', () => {
      fixture.componentRef.setInput('node', { deployer: 'gke' });
      fixture.detectChanges();
      expect(component['getDeployerLabel']()).toBe('GKE');
    });

    it('should return N/A for undefined deployer', () => {
      fixture.componentRef.setInput('node', { deployer: undefined });
      fixture.detectChanges();
      expect(component['getDeployerLabel']()).toBe('N/A');
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
