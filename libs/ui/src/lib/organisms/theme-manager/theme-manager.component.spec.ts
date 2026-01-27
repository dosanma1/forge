import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LOCAL_STORAGE } from '@forge/storage';
import { ThemeManagerComponent } from './theme-manager.component';
import { ThemeManager } from './theme-manager.service';

describe('ThemeManagerComponent', () => {
  let component: ThemeManagerComponent;
  let fixture: ComponentFixture<ThemeManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeManagerComponent],
      providers: [
        ThemeManager,
        { provide: LOCAL_STORAGE, useValue: localStorage },
        provideZonelessChangeDetection(),
        provideNoopAnimations()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ThemeManagerComponent);
    component = fixture.componentInstance;

    // Set required themes input
    fixture.componentRef.setInput('themes', [
      { name: 'Light', value: 'light' },
      { name: 'Dark', value: 'dark' }
    ]);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
