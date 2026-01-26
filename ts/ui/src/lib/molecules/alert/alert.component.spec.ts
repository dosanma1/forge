import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcAlert } from './alert.component';

describe('MmcAlert', () => {
	let component: MmcAlert;
	let fixture: ComponentFixture<MmcAlert>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcAlert],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcAlert);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
