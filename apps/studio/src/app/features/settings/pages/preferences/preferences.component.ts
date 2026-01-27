import {
	ChangeDetectionStrategy,
	Component,
	inject,
	OnInit,
	signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronRight } from '@ng-icons/lucide';
import { OptionComponent, SelectComponent, Theme, ThemeManager } from '@forge/ui';
import { BreadcrumbBuilderService } from '../../../../core/services/breadcrumb-builder.service';
import { SettingsMainLayoutComponent } from '../../layouts/settings-main-layout/settings-main-layout.component';

@Component({
	selector: 'mmc-preferences',
	templateUrl: './preferences.component.html',
	styleUrl: './preferences.component.scss',
	imports: [
		FormsModule,
		SettingsMainLayoutComponent,
		SelectComponent,
		OptionComponent,
	],
	viewProviders: [provideIcons({ lucideChevronRight })],
	host: {
		class: 'overflow-auto',
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferencesComponent implements OnInit {
	protected readonly themeManager = inject(ThemeManager);
	private readonly breadcrumbBuilder = inject(BreadcrumbBuilderService);

	protected readonly fontSizes = signal([
		{ name: 'Smaller', value: 'xs' },
		{ name: 'Small', value: 'sm' },
		{ name: 'Default', value: 'md' },
		{ name: 'Large', value: 'lg' },
		{ name: 'Larger', value: 'xl' },
	]);

	protected readonly themes = signal([
		{ name: 'System', value: 'auto' },
		{ name: 'Light', value: 'light' },
		{ name: 'Dark', value: 'dark' },
	]);

	ngOnInit(): void {
		// Set breadcrumbs for preferences page
		this.breadcrumbBuilder.setBreadcrumbsForCurrentPage();
	}

	onChangeTheme(theme: Theme): void {
		this.themeManager.setTheme(theme as Theme);
	}
}
