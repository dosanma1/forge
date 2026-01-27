import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
	EnvironmentProviders,
	inject,
	makeEnvironmentProviders,
	provideAppInitializer,
} from '@angular/core';
import { MOCK_API_DEFAULT_DELAY } from './mock-api.constants';
import { mockApiInterceptor } from './mock-api.interceptor';
import { MockApiService } from './mock-api.service';

export interface MockApiConfig {
	enabled: boolean;
	delay?: number;
}

export function provideMockApi(
	mockApiServices: any[],
	config: MockApiConfig,
): EnvironmentProviders {
	if (!config.enabled) {
		return makeEnvironmentProviders([]);
	}

	return makeEnvironmentProviders([
		// Provide the MockApiService
		MockApiService,

		// Provide mock API services
		...mockApiServices.map((service) => service),

		// Provide the default delay
		{
			provide: MOCK_API_DEFAULT_DELAY,
			useValue: config?.delay ?? 0,
		},

		// Initialize mock API services
		provideAppInitializer(() => {
			const mockApiService = inject(MockApiService);
			mockApiServices.forEach((service) => inject(service));
			console.log(
				'🎭 Mock API initialized with',
				mockApiServices.length,
				'services',
			);
			return null;
		}),
	]);
}

/**
 * Provides the Mock API interceptor
 * This should be used separately from provideMockApi to give more control
 * over when the interceptor is added
 */
export function provideMockApiInterceptor(): EnvironmentProviders {
	return makeEnvironmentProviders([
		provideHttpClient(withInterceptors([mockApiInterceptor])),
	]);
}

/**
 * Convenience function that provides both Mock API services and interceptor
 */
export function provideMockApiWithInterceptor(
	mockApiServices: any[],
	config: MockApiConfig,
): EnvironmentProviders {
	if (!config.enabled) {
		return makeEnvironmentProviders([]);
	}

	return makeEnvironmentProviders([
		// Mock API Service
		MockApiService,

		// Mock API services
		...mockApiServices.map((service) => service),

		// Default delay
		{
			provide: MOCK_API_DEFAULT_DELAY,
			useValue: config?.delay ?? 0,
		},

		// HTTP Client with interceptor
		provideHttpClient(withInterceptors([mockApiInterceptor])),

		// Initialize mock API services
		provideAppInitializer(() => {
			const mockApiService = inject(MockApiService);
			mockApiServices.forEach((service) => inject(service));
			console.log(
				'🎭 Mock API initialized with',
				mockApiServices.length,
				'services',
			);
			return null;
		}),
	]);
}
