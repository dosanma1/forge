/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { LOCAL_STORAGE } from '@forge/storage';
import { ThemeManager } from './theme-manager.service';

describe('ThemeManager', () => {
	let service: ThemeManager;
	let localStorageSpy: jasmine.SpyObj<Storage>;

	beforeEach(() => {
		localStorageSpy = jasmine.createSpyObj<Storage>('localStorage', [
			'getItem',
			'setItem',
		]);
		localStorageSpy.getItem.and.callFake((key: string) => {
			if (key === 'mmc-preferred-theme') {
				return null;
			}
			if (key === 'mmc-custom-theme-colors') {
				return null;
			}
			return null;
		});
		localStorageSpy.setItem.and.returnValue();

		TestBed.configureTestingModule({
			providers: [
				ThemeManager,
				provideZonelessChangeDetection(),
				{
					provide: LOCAL_STORAGE,
					useValue: localStorageSpy,
				},
			],
		});
	});

	it('should set theme based on device preferences (auto) when user did not set theme manually', () => {
		// Default mock returns null for everything
		service = TestBed.inject(ThemeManager);
		expect(service.theme()).toBe('auto');
	});

	it('should set theme based on stored user preferences (dark) when user already set theme manually', () => {
		localStorageSpy.getItem.and.callFake((key: string) => {
			if (key === 'mmc-preferred-theme') return 'dark';
			return null;
		});

		service = TestBed.inject(ThemeManager);

		expect(service.theme()).toBe('dark');
	});

	it('should set theme based on stored user preferences (light) when user already set theme manually', () => {
		localStorageSpy.getItem.and.callFake((key: string) => {
			if (key === 'mmc-preferred-theme') return 'light';
			return null;
		});

		service = TestBed.inject(ThemeManager);

		expect(service.theme()).toBe('light');
	});

	it('should set theme based on stored user preferences (auto) when user already set theme manually', () => {
		localStorageSpy.getItem.and.callFake((key: string) => {
			if (key === 'mmc-preferred-theme') return 'auto';
			return null;
		});

		service = TestBed.inject(ThemeManager);

		expect(service.theme()).toBe('auto');
	});
});
