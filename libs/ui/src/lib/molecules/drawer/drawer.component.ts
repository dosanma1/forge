import {
	animate,
	AnimationEvent,
	style,
	transition,
	trigger,
} from '@angular/animations';
import { ComponentType } from '@angular/cdk/portal';
import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { Subject } from 'rxjs';
import { MmcButton } from '../../atoms/button/button.component';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { MmcDrawerClose } from './drawer-close.directive';

@Component({
	selector: 'mmc-drawer',
	imports: [NgComponentOutlet, MmcDrawerClose, MmcIcon, MmcButton],
	templateUrl: './drawer.component.html',
	animations: [
		trigger('toggle', [
			transition('* => enter', [
				style({ transform: 'translateX(100%)', opacity: 0 }),
				animate(
					'300ms ease-out',
					style({ transform: 'translateX(0)', opacity: 1 }),
				),
			]),
			transition('* => exit', [
				animate(
					'200ms ease-in',
					style({ transform: 'translateX(100%)', opacity: 0 }),
				),
			]),
		]),
	],
	providers: [provideIcons({ lucideX })],
	host: {
		class: 'relative flex flex-col backdrop-blur rounded-md block sm:top-[10px] sm:bottom-[10px] sm:right-[10px] top-0 bottom-0 right-0 sm:h-[calc(100%_-_20px)] h-full w-full sm:w-auto bg-background text-foreground overflow-hidden',
		'[@toggle]': 'animationState()',
		'(@toggle.done)': 'onDone($event)',
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmcDrawer {
	title = signal<string | undefined>(undefined);
	description = signal<string | undefined>(undefined);
	showHeader = signal<boolean>(true);
	showFooter = signal<boolean>(false);
	confirmText = signal<string>('Confirm');
	cancelText = signal<string>('Cancel');
	animationState = signal<'enter' | 'exit'>('enter');
	component!: ComponentType<unknown>;
	private _onExit = new Subject<void>();
	onExit = this._onExit.asObservable();

	onDone($event: AnimationEvent) {
		if ($event.toState === 'exit') {
			this._onExit.next();
			this._onExit.complete();
		}
	}

	exit() {
		this.animationState.set('exit');
	}

	setShowHeader(show: boolean): void {
		this.showHeader.set(show);
	}

	setShowFooter(show: boolean): void {
		this.showFooter.set(show);
	}

	setConfirmText(text: string): void {
		this.confirmText.set(text);
	}

	setCancelText(text: string): void {
		this.cancelText.set(text);
	}
}
