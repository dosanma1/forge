import { Injectable, signal } from '@angular/core';

export type SideBarState = 'expanded' | 'collapsed' | 'hover';

@Injectable({
	providedIn: 'root',
})
export class SideBarService {
	public readonly state = signal<SideBarState>('expanded');

	// Backwards compatibility
	public readonly isOpened = signal<boolean>(true);

	setState(state: SideBarState) {
		this.state.set(state);
		this.isOpened.set(state === 'expanded');
	}

	toggle() {
		const currentState = this.state();
		if (currentState === 'expanded') {
			this.setState('collapsed');
		} else {
			this.setState('expanded');
		}
	}
}
