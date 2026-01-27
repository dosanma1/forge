import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LogService } from '@forge/log';

class MockLogService {
  debug() { }
  info() { }
  warn() { }
  error() { }
}

import { HandleErrorService } from './handle-error.service';

describe('HandleErrorService', () => {
  let service: HandleErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: LogService, useClass: MockLogService }
      ],
    });
    service = TestBed.inject(HandleErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
