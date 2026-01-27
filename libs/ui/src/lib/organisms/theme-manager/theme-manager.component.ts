import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OptionComponent } from '../../molecules/select/option.component';
import { SelectComponent } from '../../molecules/select/select.component';
import { CustomThemeColors, Theme, ThemeManager } from './theme-manager.service';

export type ThemeOption = {
	name: string;
	value: Theme;
};
@Component({
	selector: 'mmc-theme-manager',
	templateUrl: './theme-manager.component.html',
	styleUrl: './theme-manager.component.scss',
	imports: [FormsModule, SelectComponent, OptionComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeManagerComponent {
	protected readonly themeManager = inject(ThemeManager);

	public readonly themes = input.required<ThemeOption[]>();

	protected readonly allThemes = computed(() => [
		...this.themes(),
		{ name: 'Custom', value: 'custom' } as ThemeOption,
	]);

	protected readonly customColors = computed(() => {
		return (
			this.themeManager.customTheme() ?? {
				primary: '#3b82f6',
				background: '#ffffff',
				foreground: '#0a0a0a',
				secondary: '#f1f5f9',
				accent: '#f59e0b',
				muted: '#64748b',
			}
		);
	});

	onChangeTheme(theme: Theme): void {
		this.themeManager.setTheme(theme as Theme);
	}

	updateCustomColor(type: keyof CustomThemeColors, color: string): void {
		const current = this.customColors();
		this.themeManager.setCustomTheme({
			...current,
			[type]: color,
		});
	}
}
