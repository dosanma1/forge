import { NgClass } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	inject,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronLeft } from '@ng-icons/lucide';
import { MmcButton } from '../../../../atoms/button/button.component';
import { MmcIcon } from '../../../../atoms/icon/icon.component';
import { BasicComponent } from '../../components/basic/basic.component';
import { CollapsableComponent } from '../../components/collapsable/collapsable.component';
import { GroupComponent } from '../../components/group/group.component';
import { SideBarComponent } from '../../side-bar.component';
import { SideBarService } from '../../side-bar.service';

@Component({
	selector: 'mmc-side-bar-default',
	templateUrl: './default.component.html',
	imports: [
		NgClass,
		MmcButton,
		MmcIcon,
		BasicComponent,
		CollapsableComponent,
		GroupComponent,
	],
	viewProviders: [
		provideIcons({
			lucideChevronLeft,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmcSideBarDefault {
	protected readonly sidebarCmp = inject(SideBarComponent);
	protected readonly sidebarService = inject(SideBarService);
}
