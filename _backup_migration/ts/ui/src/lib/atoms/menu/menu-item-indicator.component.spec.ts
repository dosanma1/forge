import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcMenuItemIndicator } from './menu-item-indicator.component';

describe('MenuItemIndicatorComponent', () => {
	let component: MmcMenuItemIndicator;
	let fixture: ComponentFixture<MmcMenuItemIndicator>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcMenuItemIndicator],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcMenuItemIndicator);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
