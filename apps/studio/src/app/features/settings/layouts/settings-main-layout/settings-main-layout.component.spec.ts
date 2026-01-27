import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogService } from '@forge/log';

class MockLogService {
  debug() { }
  info() { }
  warn() { }
  error() { }
}

import { SettingsMainLayoutComponent } from './settings-main-layout.component';

describe('SettingsMainLayoutComponent', () => {
  let component: SettingsMainLayoutComponent;
  let fixture: ComponentFixture<SettingsMainLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsMainLayoutComponent]
      ,
      providers: [
        provideZonelessChangeDetection(),
        { provide: LogService, useClass: MockLogService }
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(SettingsMainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
