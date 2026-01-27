import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcTab } from './tab.component';

describe('MmcTab', () => {
	let component: MmcTab;
	let fixture: ComponentFixture<MmcTab>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcTab],
			providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcTab);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
