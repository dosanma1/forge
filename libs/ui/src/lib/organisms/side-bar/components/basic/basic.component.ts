import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavigationItem } from '../../../../../navigation/navigation.types';
import { MmcButton } from '../../../../atoms/button/button.component';
import { MmcIcon } from '../../../../atoms/icon/icon.component';
import { SideBarComponent } from '../../side-bar.component';

@Component({
	selector: 'mmc-basic',
	imports: [RouterLinkActive, RouterLink, MmcButton, MmcIcon],
	templateUrl: './basic.component.html',
	styleUrl: './basic.component.scss',
})
export class BasicComponent {
	private readonly sideBarComponent = inject(SideBarComponent);

	public readonly item = input<NavigationItem>();

	get isSideBarOpened(): boolean {
		return this.sideBarComponent.isOpened;
	}
}
