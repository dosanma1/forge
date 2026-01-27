import { Dialog, DialogConfig } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import { filter, merge, take } from 'rxjs';
import { DRAWER_DATA, MmcDrawerRef } from './drawer-ref';
import { MmcDrawer } from './drawer.component';

interface DrawerConfig<T = unknown>
	extends Pick<
		DialogConfig,
		| 'ariaDescribedBy'
		| 'ariaLabel'
		| 'ariaLabelledBy'
		| 'autoFocus'
		| 'injector'
	> {
	data?: T;
	title?: string;
	description?: string;
}

@Injectable({
	providedIn: 'root',
})
export class MmcDrawerService {
	private readonly overlay = inject(Overlay);
	private readonly dialog = inject(Dialog);

	open<T>(
		component: ComponentType<unknown>,
		options?: DrawerConfig,
	): MmcDrawerRef<T> {
		const dialogRef = this.dialog.open(MmcDrawer, {
			disableClose: true,
			positionStrategy: this.overlay
				.position()
				.global()
				.centerHorizontally()
				.right(),
			providers(dialogRef) {
				return [
					{
						provide: MmcDrawerRef,
						useValue: new MmcDrawerRef(dialogRef),
					},
					{ provide: DRAWER_DATA, useValue: options?.data },
				];
			},
			...options,
		});
		const instance = dialogRef.componentInstance as MmcDrawer;
		instance.component = component;
		instance.title.set(options?.title);
		instance.description.set(options?.description);

		const drawerRef = dialogRef.componentRef?.injector.get(
			MmcDrawerRef<T>,
		) as MmcDrawerRef<T>;

		const keydownEvent$ = dialogRef.keydownEvents.pipe(
			filter((event) => event.key === 'Escape'),
		);

		const backdropEvent$ = dialogRef.backdropClick;

		merge(keydownEvent$, backdropEvent$)
			.pipe(take(1))
			.subscribe(() => {
				drawerRef.close();
			});

		return drawerRef;
	}
}
