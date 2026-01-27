import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	input,
	signal,
} from '@angular/core';

import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';
import { NavigationItem } from '../../../navigation/navigation.types';
import { SideBarService } from './side-bar.service';
import { MmcSideBarDefault } from './variants/default/default.component';
import { MmcSideBarSimple } from './variants/simple/simple.component';

export type SideBarVariant = 'default' | 'simple';

@Component({
	selector: 'mmc-side-bar',
	standalone: true,
	templateUrl: './side-bar.component.html',
	imports: [MmcSideBarDefault, MmcSideBarSimple],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'[class]': 'classNames()',
		'(mouseenter)': 'onMouseEnter()',
		'(mouseleave)': 'onMouseLeave()',
	},
})
export class SideBarComponent {
	readonly sidebarService = inject(SideBarService);

	public readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	// Variant selection
	public readonly variant = input<SideBarVariant>('default');

	public readonly collapsible = input<boolean>(true);
	public readonly navigation = input<NavigationItem[]>([]);
	public readonly footer = input<NavigationItem[]>([]);

	// Track hover state for "expand on hover" feature
	private readonly isHovered = signal(false);

	protected classNames = computed(() => {
		const state = this.sidebarService.state();
		const isHoverMode = state === 'hover';

		return cn(
			'hidden lg:flex bg-sidebar border-r border-border flex-col shrink-0 h-full duration-300 z-[200]',
			// Base width when collapsed
			{ 'w-14 min-w-14 max-w-14': !this.isOpened },
			// Expanded width
			{ 'w-56 min-w-56 max-w-56': this.isOpened },
			// In hover mode: always use absolute positioning so it overlays content
			{ 'absolute left-0 top-0 shadow-xl': isHoverMode },
			{ 'relative': !isHoverMode },
			this.additionalClasses(),
		);
	});

	get isOpened() {
		if (!this.collapsible()) return true;

		const state = this.sidebarService.state();

		if (state === 'expanded') return true;
		if (state === 'collapsed') return false;
		if (state === 'hover') return this.isHovered();

		return this.sidebarService.isOpened();
	}

	onMouseEnter() {
		this.isHovered.set(true);
	}

	onMouseLeave() {
		this.isHovered.set(false);
	}
}
