import { ErrorHandler, inject, Injectable } from '@angular/core';
import { LogService } from '@forge/log';
import { toast } from 'ngx-sonner';

@Injectable({
	providedIn: 'root',
})
export class HandleErrorService implements ErrorHandler {
	private readonly logger = inject(LogService);

	public handleError(error: any): void {
		if (error instanceof ErrorEvent) {
			const errMsg = `An error ocurred ${error.error.message}`;
			toast.error(errMsg);
			this.logger.error(errMsg);
		} else if (error.errors) {
			const errorMessages: string[] = [];
			for (const err of error.errors) {
				this.logger.error(err.detail);

				switch (err.status) {
					case 400:
						errorMessages.push(`${err.status}: Bad Request.`);
						break;
					case 401:
						errorMessages.push(
							`${err.status}: You are unauthorized to do this action.`,
						);
						break;
					case 403:
						errorMessages.push(
							`${err.status}: You don't have permission to access the request resource.`,
						);
						break;
					case 404:
						errorMessages.push(
							`${err.status}: The requested resource does not exist.`,
						);
						break;
					case 412:
						errorMessages.push(
							`${err.status}: Precondition Failed.`,
						);
						break;
					case 500:
						errorMessages.push(
							`${err.status}: Internal Server Error.`,
						);
						break;
					case 503:
						errorMessages.push(
							`${err.status}: The requested service is not available.`,
						);
						break;
					default:
						errorMessages.push(`Something went wrong`);
				}
			}

			for (const errMsg of errorMessages) {
				toast.error(errMsg);
			}
		} else {
			const msg = 'Something went wrong';
			toast.error(msg);
			this.logger.error(`${msg}:`, error);
		}
	}
}
