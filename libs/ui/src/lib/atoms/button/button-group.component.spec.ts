import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcButtonGroup } from './button-group.component';

describe('ButtonGroupComponent', () => {
	let component: MmcButtonGroup;
	let fixture: ComponentFixture<MmcButtonGroup>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcButtonGroup],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcButtonGroup);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
