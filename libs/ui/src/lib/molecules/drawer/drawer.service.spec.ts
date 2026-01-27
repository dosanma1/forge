import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MmcDrawerService } from './drawer.service';

describe('DrawerService', () => {
	let service: MmcDrawerService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection()]
		});
		service = TestBed.inject(MmcDrawerService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
