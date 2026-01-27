import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MmcConfirmationDialogService } from './confirmation-dialog.service';

describe('MmcConfirmationDialogService', () => {
	let service: MmcConfirmationDialogService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection()]
		});
		service = TestBed.inject(MmcConfirmationDialogService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
