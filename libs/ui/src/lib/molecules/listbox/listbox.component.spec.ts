import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcListbox } from './listbox.component';

describe('MmcListbox', () => {
	let component: MmcListbox;
	let fixture: ComponentFixture<MmcListbox>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcListbox],
			providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcListbox);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
