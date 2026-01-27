import { _IdGenerator, Highlightable } from '@angular/cdk/a11y';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	ElementRef,
	forwardRef,
	inject,
	Input,
	input,
	signal,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { OptionGroupComponent } from './option-group.component';
import { SelectComponent } from './select.component';

@Component({
	selector: 'mmc-option',
	templateUrl: './option.component.html',
	styleUrl: './option.component.scss',
	imports: [MmcIcon],
	viewProviders: [provideIcons({ lucideCheck })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		role: 'option',
		'[class]': 'classNames()',
		'[id]': 'id()',
		'(click)': 'onClick()',
		'[class.is-active]': 'isActive()',
		'[class.in-group]': 'inGroup',
		'[class.selected]': 'isSelected()',
		'[attr.aria-selected]': 'isSelected()',
		'[attr.aria-disabled]': 'disabled',
	},
})
export class OptionComponent implements Highlightable {
	public readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	value = input.required<unknown>();
	@Input()
	disabled?: boolean | undefined;

	id = input(inject(_IdGenerator).getId('option-'));
	isActive = signal(false);
	isSelected = () => this.select.isSelected(this.value());
	optionGroup = inject(OptionGroupComponent, { optional: true });

	element = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;

	select = inject<SelectComponent>(forwardRef(() => SelectComponent));

	inGroup = !!this.optionGroup;

	private host = inject<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);

	get content() {
		return this.host.nativeElement.textContent;
	}

	protected classNames = computed(() =>
		cn(
			'relative flex w-full cursor-default items-center justify-between rounded p-[6px] text-sm outline-hidden select-none',
			'focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground',
			'disabled:pointer-events-none disabled:opacity-50 disabled:text-muted-foreground',
			this.additionalClasses(),
		),
	);

	getLabel(): string {
		return this.host.nativeElement.textContent || '';
	}

	onClick() {
		this.select.toggleValue(this);
	}

	setActiveStyles(): void {
		this.isActive.set(true);
		this.scrollIntoView();
	}

	scrollIntoView() {
		this.element.scrollIntoView({
			block: 'nearest',
			inline: 'nearest',
		});
	}
	setInactiveStyles(): void {
		this.isActive.set(false);
	}
}
