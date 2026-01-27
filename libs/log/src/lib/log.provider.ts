import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { LogService, LogServiceOptions } from './log.service';

export const provideLog = (options: LogServiceOptions): EnvironmentProviders =>
	makeEnvironmentProviders([
		{
			provide: LogService,
			useFactory: () => new LogService(options),
		},
	]);
