import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { converter } from 'culori';
import { Subject } from 'rxjs';
import { LOCAL_STORAGE } from '@forge/storage';

// Keep these constants in sync with the code in index.html

export const THEME_PREFERENCE_LOCAL_STORAGE_KEY = 'mmc-preferred-theme';
export const DATA_THEME = 'data-theme';
export const DARK_MODE_NAME = 'dark';
export const LIGHT_MODE_NAME = 'light';
export const PREFERS_COLOR_SCHEME_DARK = '(prefers-color-scheme: dark)';

export type Theme = 'dark' | 'light' | 'auto' | 'custom';

export interface CustomThemeColors {
  primary: string;
  background: string;
  foreground: string;
  secondary: string;
  accent: string;
  muted: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeManager {
  private readonly document = inject(DOCUMENT);
  private readonly localStorage = inject(LOCAL_STORAGE);
  private readonly platformId = inject(PLATFORM_ID);

  readonly theme = signal<Theme | null>(this.getThemeFromLocalStorageValue());
  readonly customTheme = signal<CustomThemeColors | null>(
    this.getCustomThemeFromLocalStorageValue(),
  );
  // Zoneless - it's required to notify that theme was changed. It could be removed when signal-based components will be available.
  readonly themeChanged$ = new Subject<void>();

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadThemePreference();
    this.watchPreferredColorScheme();
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    this.setThemeInLocalStorage();
    if (theme === 'custom') {
      this.applyCustomTheme();
    } else {
      this.removeCustomThemeStyles();
      this.setThemeBodyClasses(theme === 'auto' ? preferredScheme() : theme);
    }
  }

  setCustomTheme(colors: CustomThemeColors): void {
    this.customTheme.set(colors);
    this.setCustomThemeInLocalStorage();
    if (this.theme() === 'custom') {
      this.applyCustomTheme();
    }
  }

  // 1. Read theme preferences stored in localStorage
  // 2. In case when there are no stored user preferences, then read them from device preferences.
  private loadThemePreference(): void {
    const savedUserPreference = this.getThemeFromLocalStorageValue();
    const useTheme = savedUserPreference ?? 'auto';

    this.setTheme(useTheme);
  }

  // Set theme classes on the body element
  private setThemeBodyClasses(theme: 'dark' | 'light'): void {
    const document = this.document.documentElement;
    if (theme === 'dark') {
      document.setAttribute(DATA_THEME, DARK_MODE_NAME);
    } else {
      document.setAttribute(DATA_THEME, LIGHT_MODE_NAME);
    }
    this.themeChanged$.next();
  }

  private applyCustomTheme(): void {
    const colors = this.customTheme();
    if (!colors) return;

    const document = this.document.documentElement;
    document.setAttribute(DATA_THEME, 'custom');

    // Helper to convert hex to oklch space-separated string
    const setVariable = (name: string, hex: string) => {
      const oklch = converter('oklch');
      const color = oklch(hex);
      if (color) {
        // Format: L C H
        const l = color.l ?? 0;
        const c = color.c ?? 0;
        const h = color.h ?? 0;
        document.style.setProperty(name, `${l} ${c} ${h}`);
      }
    };

    setVariable('--primary', colors.primary);
    setVariable('--background', colors.background);
    setVariable('--foreground', colors.foreground);
    setVariable('--secondary', colors.secondary);
    setVariable('--accent', colors.accent);
    setVariable('--muted', colors.muted);

    this.themeChanged$.next();
  }

  private removeCustomThemeStyles(): void {
    const document = this.document.documentElement;
    document.style.removeProperty('--primary');
    document.style.removeProperty('--background');
    document.style.removeProperty('--foreground');
    document.style.removeProperty('--secondary');
    document.style.removeProperty('--accent');
    document.style.removeProperty('--muted');
  }

  private getThemeFromLocalStorageValue(): Theme | null {
    const theme = this.localStorage?.getItem(
      THEME_PREFERENCE_LOCAL_STORAGE_KEY,
    ) as Theme | null;
    return theme ?? null;
  }

  private getCustomThemeFromLocalStorageValue(): CustomThemeColors | null {
    const colors = this.localStorage?.getItem('mmc-custom-theme-colors');
    return colors ? JSON.parse(colors) : null;
  }

  private setThemeInLocalStorage(): void {
    if (this.theme()) {
      this.localStorage?.setItem(
        THEME_PREFERENCE_LOCAL_STORAGE_KEY,
        this.theme()!,
      );
    }
  }

  private setCustomThemeInLocalStorage(): void {
    if (this.customTheme()) {
      this.localStorage?.setItem(
        'mmc-custom-theme-colors',
        JSON.stringify(this.customTheme()),
      );
    }
  }

  private watchPreferredColorScheme() {
    window
      .matchMedia(PREFERS_COLOR_SCHEME_DARK)
      .addEventListener('change', (event) => {
        if (this.theme() === 'auto') {
          const preferredScheme = event.matches ? 'dark' : 'light';
          this.setThemeBodyClasses(preferredScheme);
        }
      });
  }
}

function preferredScheme(): 'dark' | 'light' {
  return window.matchMedia(PREFERS_COLOR_SCHEME_DARK).matches
    ? 'dark'
    : 'light';
}
