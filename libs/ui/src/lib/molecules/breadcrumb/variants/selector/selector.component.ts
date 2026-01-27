import {
	ChangeDetectionStrategy,
	Component,
	input,
	output,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
	lucideCheck,
	lucideChevronDown,
	lucidePlus,
	lucideSearch,
} from '@ng-icons/lucide';
import { MmcButton } from '../../../../atoms/button/button.component';
import { MmcIcon } from '../../../../atoms/icon/icon.component';
import { MmcMenuItem } from '../../../../atoms/menu/menu-item.directive';
import { MmcMenuTrigger } from '../../../../atoms/menu/menu-trigger.directive';
import { MmcMenu } from '../../../../atoms/menu/menu.directive';

export interface BreadcrumbSelectorItem {
	id: string;
	label: string;
	icon?: string;
	imageUrl?: string;
}

export interface BreadcrumbSelectorSegment {
	id: string;
	label: string;
	items: BreadcrumbSelectorItem[];
	selectedId?: string;
	showAddButton?: boolean;
	addButtonLabel?: string;
	searchPlaceholder?: string;
}

export interface BreadcrumbLogo {
	imageUrl?: string;
	icon?: string;
	alt?: string;
}

@Component({
	selector: 'mmc-breadcrumb-selector',
	templateUrl: './selector.component.html',
	styleUrl: './selector.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		MmcButton,
		MmcIcon,
		MmcMenu,
		MmcMenuItem,
		MmcMenuTrigger,
	],
	viewProviders: [
		provideIcons({
			lucideChevronDown,
			lucideCheck,
			lucidePlus,
			lucideSearch,
		}),
	],
})
export class MmcBreadcrumbSelector {
	readonly segments = input.required<BreadcrumbSelectorSegment[]>();
	readonly logo = input<BreadcrumbLogo>();

	readonly itemSelected = output<{ segmentId: string; itemId: string }>();
	readonly addClicked = output<{ segmentId: string }>();
	readonly logoClick = output<void>();
	readonly segmentClick = output<{ segmentId: string; itemId: string }>();

	onLogoClick(): void {
		this.logoClick.emit();
	}

	onSegmentClick(segmentId: string, itemId: string | undefined): void {
		if (itemId) {
			this.segmentClick.emit({ segmentId, itemId });
		}
	}

	getSelectedItem(segment: BreadcrumbSelectorSegment): BreadcrumbSelectorItem | undefined {
		return segment.items.find((item) => item.id === segment.selectedId);
	}

	onItemSelect(segmentId: string, itemId: string): void {
		this.itemSelected.emit({ segmentId, itemId });
	}

	onAddClick(segmentId: string): void {
		this.addClicked.emit({ segmentId });
	}
}
