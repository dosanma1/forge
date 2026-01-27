import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcBadge } from './badge.component';

describe('BadgeComponent', () => {
	let component: MmcBadge;
	let fixture: ComponentFixture<MmcBadge>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcBadge],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcBadge);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
