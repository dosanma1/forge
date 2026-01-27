import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcIcon } from './icon.component';

describe('IconComponent', () => {
	let component: MmcIcon;
	let fixture: ComponentFixture<MmcIcon>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcIcon],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcIcon);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
