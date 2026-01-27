import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LogService } from '@forge/log';
import { ThemeManager } from '@forge/ui';
import { BreadcrumbBuilderService } from '../../../../core/services/breadcrumb-builder.service';

class MockLogService {
  debug() { }
  info() { }
  warn() { }
  error() { }
}

class MockBreadcrumbBuilderService {
  setBreadcrumbsForCurrentPage() { }
}

import { PreferencesComponent } from './preferences.component';

describe('PreferencesComponent', () => {
  let component: PreferencesComponent;
  let fixture: ComponentFixture<PreferencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreferencesComponent]
      ,
      providers: [
        provideZonelessChangeDetection(),
        { provide: LogService, useClass: MockLogService },
        { provide: BreadcrumbBuilderService, useClass: MockBreadcrumbBuilderService },
        ThemeManager,
        provideNoopAnimations()
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(PreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
