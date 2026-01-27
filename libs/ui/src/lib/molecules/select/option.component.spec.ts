import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { OptionComponent } from './option.component';
import { SelectComponent } from './select.component';

@Component({
  template: `
		<mmc-select>
			<mmc-option [value]="'test'">Test Option</mmc-option>
		</mmc-select>
	`,
  imports: [SelectComponent, OptionComponent],
})
class TestWrapperComponent { }

describe('OptionComponent', () => {
  let component: TestWrapperComponent;
  let fixture: ComponentFixture<TestWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestWrapperComponent],
      providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TestWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
