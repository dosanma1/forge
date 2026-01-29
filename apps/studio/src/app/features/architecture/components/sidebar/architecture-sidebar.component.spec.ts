import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArchitectureSidebarComponent } from './architecture-sidebar.component';

describe('ArchitectureSidebarComponent', () => {
  let component: ArchitectureSidebarComponent;
  let fixture: ComponentFixture<ArchitectureSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchitectureSidebarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ArchitectureSidebarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('nodes', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show save button when there are unsaved changes', () => {
    fixture.componentRef.setInput('unsavedChanges', 1);
    fixture.detectChanges();
    const saveButton = fixture.nativeElement.querySelector('[title="Save changes"]');
    expect(saveButton).toBeTruthy();
  });

  it('should hide save button when there are no unsaved changes', () => {
    fixture.componentRef.setInput('unsavedChanges', 0);
    fixture.detectChanges();
    const saveButton = fixture.nativeElement.querySelector('[title="Save changes"]');
    expect(saveButton).toBeFalsy();
  });

  it('should emit saveChanges when save button clicked', () => {
    const saveSpy = jest.spyOn(component.saveChanges, 'emit');
    fixture.componentRef.setInput('unsavedChanges', 1);
    fixture.detectChanges();
    const saveButton = fixture.nativeElement.querySelector('[title="Save changes"]');
    saveButton.click();
    expect(saveSpy).toHaveBeenCalled();
  });

  it('should show open folder button when no project path', () => {
    fixture.componentRef.setInput('projectPath', null);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Open Folder');
  });
});
