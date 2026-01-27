import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcInputChip } from './input-chip.component';

describe('InputChipComponent', () => {
	let component: MmcInputChip;
	let fixture: ComponentFixture<MmcInputChip>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcInputChip],
			providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcInputChip);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
