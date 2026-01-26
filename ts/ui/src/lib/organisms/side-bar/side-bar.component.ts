import { NgClass } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	input,
} from '@angular/core';

import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';
import { NavigationItem } from '../../../navigation/navigation.types';
import { MmcButton } from '../../atoms/button/button.component';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { BasicComponent } from './components/basic/basic.component';
import { CollapsableComponent } from './components/collapsable/collapsable.component';
import { GroupComponent } from './components/group/group.component';
import { SideBarService } from './side-bar.service';

@Component({
	selector: 'mmc-side-bar',
	standalone: true,
	templateUrl: './side-bar.component.html',
	imports: [
		NgClass,
		MmcButton,
		MmcIcon,
		BasicComponent,
		CollapsableComponent,
		GroupComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'[class]': 'classNames()',
	},
})
export class SideBarComponent {
	protected readonly sidebarService = inject(SideBarService);

	public readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	public readonly collapsible = input<boolean>(true);
	public readonly navigation = input<NavigationItem[]>([]);
	public readonly footer = input<NavigationItem[]>([]);

	protected classNames = computed(() =>
		cn(
			'hidden lg:flex bg-sidebar relative flex-col flex-auto top-0 h-full min-h-full max-h-full duration-300 z-[200] w-64 min-w-64 max-w-64',
			{ 'w-16 min-w-16 max-w-16': !this.isOpened },
			this.additionalClasses(),
		),
	);

	get isOpened() {
		if (!this.collapsible()) return true;

		return this.sidebarService.isOpened();
	}
}
