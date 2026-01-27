import { Injectable, signal } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class SideBarService {
	public readonly isOpened = signal<boolean>(true);

	toggle() {
		this.isOpened.update((opened) => !opened);
	}
}
