import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcSpinner } from './spinner.component';

describe('SpinnerComponent', () => {
	let component: MmcSpinner;
	let fixture: ComponentFixture<MmcSpinner>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcSpinner],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcSpinner);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
