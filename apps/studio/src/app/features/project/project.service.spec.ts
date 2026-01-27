import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LogService } from '@forge/log';

class MockLogService {
	debug() { }
	info() { }
	warn() { }
	error() { }
}

import { ProjectService } from './project.service';

describe('ProjectService', () => {
	let service: ProjectService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				{ provide: LogService, useClass: MockLogService },
				provideHttpClient()
			],
		});
		service = TestBed.inject(ProjectService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
