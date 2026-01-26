import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcListboxOption } from './listbox-option.component';
import { MmcListbox } from './listbox.component';

@Component({
	template: `
		<mmc-listbox>
			<mmc-listbox-option value="test">Test Option</mmc-listbox-option>
		</mmc-listbox>
	`,
	imports: [MmcListbox, MmcListboxOption],
})
class TestWrapperComponent { }

describe('ListboxOption', () => {
	let component: TestWrapperComponent;
	let fixture: ComponentFixture<TestWrapperComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestWrapperComponent],
			providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
		}).compileComponents();

		fixture = TestBed.createComponent(TestWrapperComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
