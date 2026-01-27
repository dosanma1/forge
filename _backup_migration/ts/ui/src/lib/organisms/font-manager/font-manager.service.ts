import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { LOCAL_STORAGE } from 'storage';

export const FONT_SIZE_LOCAL_STORAGE_KEY = 'mmc-font-size-preference';

export type FontSize = 'smaller' | 'small' | 'default' | 'large' | 'larger';

// Map font size options to percentage values (scales all text proportionally)
const FONT_SIZE_MAP: Record<FontSize, string> = {
    smaller: '75%',    // -25% from base
    small: '87.5%',    // -12.5% from base
    default: '100%',   // base size (no change)
    large: '112.5%',   // +12.5% from base
    larger: '125%',    // +25% from base
};

@Injectable({
    providedIn: 'root',
})
export class FontManager {
    private readonly document = inject(DOCUMENT);
    private readonly localStorage = inject(LOCAL_STORAGE);
    private readonly platformId = inject(PLATFORM_ID);

    readonly fontSize = signal<FontSize>(this.getFontSizeFromLocalStorage());

    constructor() {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        this.applyFontSize(this.fontSize());
    }

    setFontSize(size: FontSize): void {
        this.fontSize.set(size);
        this.applyFontSize(size);
        this.saveFontSizeToLocalStorage(size);
    }

    private applyFontSize(size: FontSize): void {
        const rootElement = this.document.documentElement;
        // Always use percentage-based scaling to proportionally affect all text
        rootElement.style.setProperty('font-size', FONT_SIZE_MAP[size]);
    }

    private getFontSizeFromLocalStorage(): FontSize {
        const saved = this.localStorage?.getItem(
            FONT_SIZE_LOCAL_STORAGE_KEY,
        ) as FontSize | null;
        return saved ?? 'default';
    }

    private saveFontSizeToLocalStorage(size: FontSize): void {
        this.localStorage?.setItem(FONT_SIZE_LOCAL_STORAGE_KEY, size);
    }
}
