import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	output,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { cva, VariantProps } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';
import { MmcIcon } from '../../atoms/icon/icon.component';

export const alertVariants = cva(`border-border rounded-lg border px-4 py-2`, {
	variants: {
		variant: {
			default: '',
			info: 'border-blue-500/50 text-blue-600',
			warning: 'border-amber-500/50 text-amber-600',
			error: 'border-destructive text-destructive',
			success: 'border-green-500/50 text-green-600',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});

type AlertProps = VariantProps<typeof alertVariants>;

export type AlertVariant = NonNullable<AlertProps['variant']>;

@Component({
	selector: 'mmc-alert',
	template: `
		<div [class]="classNames()">
			<div class="flex text-sm">
				<ng-content></ng-content>
				@if (removable()) {
					<div class="ml-auto pl-3 h-0">
						<button
							class="focus-visible:border-ring focus-visible:ring-ring/50 opacity-60 hover:opacity-100 -my-px -ms-px -me-1.5 inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[inherit] p-0 transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
							(click)="onRemove()"
						>
							<mmc-icon
								size="sm"
								name="lucideX"
								aria-hidden="true"
								aria-label="Delete"
								class="text-foreground"
							/>
						</button>
					</div>
				}
			</div>
		</div>
	`,
	imports: [MmcIcon],
	viewProviders: [provideIcons({ lucideX })],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmcAlert {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	readonly variant = input<AlertVariant>('default');
	readonly removable = input<boolean>(false);
	readonly remove = output<void>();

	protected classNames = computed(() =>
		cn(
			'',
			alertVariants({
				variant: this.variant(),
			}),
			this.additionalClasses(),
		),
	);

	protected onRemove(): void {
		this.remove.emit();
	}
}
