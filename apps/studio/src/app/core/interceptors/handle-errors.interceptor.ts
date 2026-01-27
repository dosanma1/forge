import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HandleErrorService } from '../services/handle-error.service';

export const handleErrorsInterceptor: HttpInterceptorFn = (req, next) => {
  const handleErrorService = inject(HandleErrorService);

  return next(req).pipe(
    tap({
      error: (httpError: HttpErrorResponse) => {
        handleErrorService.handleError(httpError.error);
      },
    }),
  );
};
