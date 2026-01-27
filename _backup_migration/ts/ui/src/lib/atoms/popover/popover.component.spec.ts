import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcPopover } from './popover.component';

describe('PopoverComponent', () => {
	let component: MmcPopover;
	let fixture: ComponentFixture<MmcPopover>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcPopover],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcPopover);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
