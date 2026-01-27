import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OptionComponent } from '../../molecules/select/option.component';
import { SelectComponent } from '../../molecules/select/select.component';
import { FontManager, FontSize } from './font-manager.service';

export interface FontSizeOption {
    label: string;
    value: FontSize;
    description: string;
}

@Component({
    selector: 'mmc-font-manager',
    template: `
		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium">Font Size</label>
			<mmc-select
				placeholder="Select font size"
				variant="outline"
				class="w-[200px]"
				[ngModel]="fontManager.fontSize()"
				(ngModelChange)="onChangeFontSize($event)"
			>
				@for (option of options(); track option.value; let idx = $index) {
					<mmc-option [value]="option.value">
						<div class="flex flex-col">
							<span class="text-sm font-medium">{{ option.label }}</span>
						</div>
					</mmc-option>
				}
			</mmc-select>
		</div>
	`,
    imports: [FormsModule, SelectComponent, OptionComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FontManagerComponent {
    protected readonly fontManager = inject(FontManager);

    readonly options = input<FontSizeOption[]>([
        {
            label: 'Smaller',
            value: 'smaller',
            description: '75% (-25% from base)',
        },
        {
            label: 'Small',
            value: 'small',
            description: '87.5% (-12.5% from base)',
        },
        {
            label: 'Default',
            value: 'default',
            description: '100% (base size)',
        },
        {
            label: 'Large',
            value: 'large',
            description: '112.5% (+12.5% from base)',
        },
        {
            label: 'Larger',
            value: 'larger',
            description: '125% (+25% from base)',
        },
    ]);

    protected onChangeFontSize(size: FontSize): void {
        this.fontManager.setFontSize(size);
    }
}
