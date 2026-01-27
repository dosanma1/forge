import {
	ChangeDetectionStrategy,
	Component,
	inject,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucidePanelLeft } from '@ng-icons/lucide';
import { MmcButton } from '../../../../atoms/button/button.component';
import { MmcIcon } from '../../../../atoms/icon/icon.component';
import { MmcMenuItemIndicator } from '../../../../atoms/menu/menu-item-indicator.component';
import { MmcMenuItemRadio } from '../../../../atoms/menu/menu-item-radio.directive';
import { MmcMenuTrigger } from '../../../../atoms/menu/menu-trigger.directive';
import { MmcMenu } from '../../../../atoms/menu/menu.directive';
import { BasicComponent } from '../../components/basic/basic.component';
import { CollapsableComponent } from '../../components/collapsable/collapsable.component';
import { GroupComponent } from '../../components/group/group.component';
import { SideBarComponent } from '../../side-bar.component';
import { SideBarService, SideBarState } from '../../side-bar.service';

@Component({
	selector: 'mmc-side-bar-simple',
	templateUrl: './simple.component.html',
	host: {
		class: 'flex flex-col flex-1 h-full',
	},
	imports: [
		MmcButton,
		MmcIcon,
		BasicComponent,
		CollapsableComponent,
		GroupComponent,
		MmcMenu,
		MmcMenuTrigger,
		MmcMenuItemRadio,
		MmcMenuItemIndicator,
	],
	viewProviders: [
		provideIcons({
			lucidePanelLeft,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmcSideBarSimple {
	protected readonly sidebarCmp = inject(SideBarComponent);
	protected readonly sidebarService = inject(SideBarService);

	setSidebarState(state: SideBarState) {
		this.sidebarService.setState(state);
	}
}
