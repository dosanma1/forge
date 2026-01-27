import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MmcDivider } from './divider.component';

describe('DividerComponent', () => {
	let component: MmcDivider;
	let fixture: ComponentFixture<MmcDivider>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcDivider],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcDivider);
		component = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should add vertical class', async () => {
		fixture.componentRef.setInput('orientation', 'vertical');
		fixture.detectChanges();
		await fixture.whenStable();
		expect(fixture.nativeElement.classList).toContain('border-r');
	});
});
