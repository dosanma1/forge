import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LogService } from 'log';

import { MmcBreadcrumb } from './breadcrumb.component';

describe('BreadcrumbComponent', () => {
	let component: MmcBreadcrumb;
	let fixture: ComponentFixture<MmcBreadcrumb>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcBreadcrumb],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
				LogService,
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcBreadcrumb);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
