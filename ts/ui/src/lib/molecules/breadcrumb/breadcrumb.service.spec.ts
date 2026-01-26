import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LogService } from 'log';

import { MmcBreadcrumbService } from './breadcrumb.service';

describe('BreadcrumbService', () => {
	let service: MmcBreadcrumbService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
				LogService,
			],
		});
		service = TestBed.inject(MmcBreadcrumbService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
