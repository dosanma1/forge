import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { provideNgIconsConfig, withExceptionLogger } from '@ng-icons/core';
import { Logger, LogLevel, provideLog } from '@forge/log';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { handleErrorsInterceptor } from './core/interceptors/handle-errors.interceptor';
import { provideWindow } from './core/services/window.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([handleErrorsInterceptor])),
    provideWindow(),
    provideLog({
      name: environment.app,
      withDate: true,
      logLevel: environment.logLevel as LogLevel,
      loggers: environment.loggers as Logger[],
    }),
    provideNgIconsConfig({}, withExceptionLogger()),
  ],
};
