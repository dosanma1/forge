import {
	HttpErrorResponse,
	HttpInterceptorFn,
	HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { LogService } from '@forge/log';
import { delay, of, switchMap, throwError } from 'rxjs';
import { MOCK_API_DEFAULT_DELAY } from './mock-api.constants';
import { MockApiService } from './mock-api.service';

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
	const logger = inject(LogService);
	const _defaultDelay = inject(MOCK_API_DEFAULT_DELAY);
	const _mockApiService = inject(MockApiService);

	logger.debug(
		`Mocking request [${req.method.toLocaleUpperCase()}] ${req.urlWithParams}`,
	);

	// Try to get the request handler
	const { handler, urlParams } = _mockApiService.findHandler(
		req.method.toUpperCase(),
		req.url,
	);

	// Pass through if the request handler does not exist
	if (!handler) {
		logger.debug(
			`Mock handler not found for [${req.method.toLocaleUpperCase()}] ${req.urlWithParams}`,
		);
		return next(req);
	}

	// Set the intercepted request on the handler
	handler.request = req;

	if (req.body) {
		logger.debug(
			'Mock handler body: \n',
			JSON.stringify(req.body, null, 2),
		);
	}

	// Set the url params on the handler
	handler.urlParams = urlParams;

	// Subscribe to the response function observable
	return handler.response.pipe(
		delay(handler.delay ?? _defaultDelay ?? 0),
		switchMap((response) => {
			// If there is no response data,
			// throw an error response
			if (!response) {
				response = new HttpErrorResponse({
					error: 'NOT FOUND',
					status: 404,
					statusText: 'NOT FOUND',
				});

				logger.debug(`Response not found for handler ${handler.url}`);

				return throwError(() => response);
			}

			// Parse the response data
			const data = {
				status: response[0],
				body: response[1],
			};

			// If the status code is in between 200 and 300,
			// return a success response
			if (data.status >= 200 && data.status < 300) {
				response = new HttpResponse({
					body: data.body,
					status: data.status,
					statusText: 'OK',
				});

				return of(response);
			}

			// For other status codes,
			// throw an error response
			response = new HttpErrorResponse({
				error: data.body.error,
				status: data.status,
				statusText: 'ERROR',
			});

			return throwError(() => response);
		}),
	);
};
