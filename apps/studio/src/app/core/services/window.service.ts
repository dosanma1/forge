import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders
} from '@angular/core';

/* Create a new injection token for injecting the window into a component. */
export const WINDOW = new InjectionToken<Window>('Window');

export const provideWindow = (): EnvironmentProviders =>
  makeEnvironmentProviders([
    {
      provide: WINDOW,
      useFactory: (): Window => window
    }
  ]);
