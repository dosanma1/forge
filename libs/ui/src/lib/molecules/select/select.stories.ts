import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import {
	lucideChartArea,
	lucideTrafficCone,
	lucideWallet,
} from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { OptionComponent } from './option.component';
import { SelectLabelDirective } from './select-label.directive';
import { SelectComponent } from './select.component';

const countries = [
	{ code: 'KA', name: 'Georgia' },
	{ code: 'US', name: 'United States' },
	{ code: 'CA', name: 'Canada' },
	{ code: 'GB', name: 'United Kingdom' },
	{ code: 'DE', name: 'Germany' },
	{ code: 'FR', name: 'France' },
	{ code: 'JP', name: 'Japan' },
	{ code: 'AU', name: 'Australia' },
	{ code: 'IT', name: 'Italy' },
	{ code: 'ES', name: 'Spain' },
	{ code: 'CN', name: 'China' },
	{ code: 'IN', name: 'India' },
	{ code: 'BR', name: 'Brazil' },
	{ code: 'ZA', name: 'South Africa' },
	{ code: 'RU', name: 'Russia' },
	{ code: 'MX', name: 'Mexico' },
	{ code: 'KR', name: 'South Korea' },
	{ code: 'AR', name: 'Argentina' },
	{ code: 'SA', name: 'Saudi Arabia' },
	{ code: 'NG', name: 'Nigeria' },
	{ code: 'EG', name: 'Egypt' },
];

const customOptions = [
	{ label: 'Electricity', value: 'lucideTrafficCone' },
	{ label: 'Blender', value: 'lucideWallet' },
	{ label: 'Iron', value: 'lucideChartArea' },
];

const directories = [
	{
		name: 'Documents',
		files: [
			{
				name: 'Profile Picture',
			},
			{
				name: 'Work File',
			},
		],
	},
	{
		name: 'Downloads',
		files: [
			{
				name: 'The Dark Knight',
			},
			{
				name: 'Joker',
			},
		],
	},
];
@Component({
	selector: 'mmc-show-case-select',
	template: `
		<p class="mb-2">Single select</p>
		<mmc-select
			[formControl]="formControlSingle"
			placeholder="Countries"
			variant="outline"
			class="w-[250px]"
		>
			@for (option of countries; track $index) {
				<mmc-option [value]="option.code">{{ option.name }}</mmc-option>
			}
		</mmc-select>

		<p class="mt-4 mb-2">Multiple select</p>
		<mmc-select
			[formControl]="formControlMulti"
			placeholder="Countries"
			class="w-[250px]"
			variant="outline"
			[multiple]="true"
		>
			@for (option of countries; track $index) {
				<mmc-option [value]="option.code">{{ option.name }}</mmc-option>
			}
		</mmc-select>

		<p class="mt-4 mb-2">Custom label</p>
		<mmc-select
			[formControl]="customLabelControl"
			placeholder="Custom label"
			variant="outline"
			class="w-[250px]"
		>
			<ng-template mmcSelectLabel let-options>
				<div class="flex-1 truncate text-left">
					<mmc-icon size="sm" [name]="options[0].value()"> </mmc-icon>
					{{ options[0].content }}
				</div>
			</ng-template>
			@for (option of customOptions; track $index) {
				<mmc-option [value]="option.value">
					<mmc-icon size="sm" [name]="option.value"> </mmc-icon>
					{{ option.label }}
				</mmc-option>
			}
		</mmc-select>
	`,
	imports: [
		ReactiveFormsModule,
		MmcIcon,
		SelectComponent,
		SelectLabelDirective,
		OptionComponent,
	],
	viewProviders: [
		provideIcons({ lucideTrafficCone, lucideWallet, lucideChartArea }),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowCaseSelectComponent {
	countries = countries;
	directories = directories;
	customOptions = customOptions;

	formControlSingle = new FormControl(null, Validators.required);

	formControlMulti = new FormControl(['US', 'CA'], Validators.required);

	customLabelControl = new FormControl(null);
}

const meta: Meta<ShowCaseSelectComponent> = {
	title: 'Molecules/Select',
	component: ShowCaseSelectComponent,
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [ShowCaseSelectComponent],
		}),
	],
};

export default meta;
type Story = StoryObj<ShowCaseSelectComponent>;

export const Default: Story = {};
