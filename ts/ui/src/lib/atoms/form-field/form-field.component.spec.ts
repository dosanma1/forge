import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcFormField } from './form-field.component';

describe('FormFieldComponent', () => {
	let component: MmcFormField;
	let fixture: ComponentFixture<MmcFormField>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcFormField],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcFormField);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
