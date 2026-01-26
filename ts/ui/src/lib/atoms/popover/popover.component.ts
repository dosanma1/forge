import {
	animate,
	AnimationEvent,
	style,
	transition,
	trigger,
} from '@angular/animations';
import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { DomPortal } from '@angular/cdk/portal';
import { DOCUMENT, NgClass, NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	effect,
	ElementRef,
	inject,
	input,
	model,
	OnDestroy,
	output,
	TemplateRef,
	untracked,
	viewChild,
} from '@angular/core';
import { ClassValue } from 'clsx';
import {
	asyncScheduler,
	filter,
	fromEvent,
	merge,
	observeOn,
	Subscription,
} from 'rxjs';
import { cn } from '../../../helpers/cn';
import { MmcPopoverOrigin } from './popover-origin.directive';

export type POPOVER_POSITIONS_Y =
	| 'top'
	| 'top-left'
	| 'right'
	| 'bottom'
	| 'left';

@Component({
	selector: 'mmc-popover',
	imports: [NgClass, NgTemplateOutlet],
	templateUrl: './popover.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('toggle', [
			transition('false => true', [
				style({ transform: 'scale(0)', opacity: 0 }),
				animate('150ms', style({ opacity: 1, transform: 'scale(1)' })),
			]),
			transition('true => false', [
				style({ opacity: 1, transform: 'scale(1)', display: 'block' }),
				animate('150ms', style({ opacity: 0, transform: 'scale(0)' })),
			]),
		]),
	],
})
export class MmcPopover implements OnDestroy {
	public readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	public readonly isOpen = model(false);
	public readonly origin = input.required<MmcPopoverOrigin>();
	public readonly offsetX = input<number>();
	public readonly offsetY = input<number>();
	public readonly styled = input(false);
	public readonly hasBackdrop = input<boolean>(false);
	public readonly blockScroll = input<boolean>(false);
	public readonly outsideClose = input(false);
	public readonly stretchToOrigin = input(false);
	public readonly restoreFocus = input(false);
	public readonly positionY = input<POPOVER_POSITIONS_Y>('bottom');

	public readonly opened = output();
	public readonly closed = output();

	protected content =
		contentChild.required<TemplateRef<unknown>>(TemplateRef);
	private overlay = inject(Overlay);
	private popover = viewChild.required<ElementRef<HTMLElement>>('popover');
	private document = inject(DOCUMENT);
	private overlayRef: OverlayRef | undefined;
	private globalSub: Subscription | undefined;

	protected classNames = computed(() => cn(this.additionalClasses()));

	get isOpened() {
		return !!this.overlayRef;
	}

	constructor() {
		effect(() => {
			const isOpen = this.isOpen();
			if (isOpen) {
				this.show();
			} else {
				this.hide();
			}
		});
	}

	hide() {
		if (!this.isOpened) {
			return;
		}
		this.isOpen.set(false);
	}

	show() {
		if (this.isOpened) {
			return;
		}
		untracked(() => {
			const scrollStrategy = this.blockScroll()
				? this.overlay.scrollStrategies.block()
				: this.overlay.scrollStrategies.reposition();
			const origin = this.origin();
			const connectingTo = origin.el;
			const position = this.positionY();

			this.overlayRef = this.overlay.create({
				positionStrategy: this.overlay
					.position()
					.flexibleConnectedTo(connectingTo)
					.withPositions([this.getOverlayPosition(position)])
					// .withFlexibleDimensions(true)
					.withPush(false),
				// .withLockedPosition(true),
				hasBackdrop: this.hasBackdrop(),
				scrollStrategy: scrollStrategy,
			});
			this.overlayRef.attach(new DomPortal(this.popover()));
			this.tryStretch();
		});
	}

	onDone(event: AnimationEvent) {
		if (
			event.fromState.toString() === 'true' &&
			event.toState.toString() === 'false'
		) {
			this.dispose();
			return;
		}
		if (event.toState.toString() === 'true') {
			this.listenToGlobalEvents();
			this.opened.emit();
		}
	}

	private listenToGlobalEvents() {
		if (!this.isOpened) {
			return;
		}
		this.globalSub?.unsubscribe();
		this.globalSub = new Subscription();
		const overlayRef = this.overlayRef as OverlayRef;

		if (this.outsideClose()) {
			const outsideClick$ = overlayRef
				.outsidePointerEvents()
				.pipe(observeOn(asyncScheduler));
			const escapeEvent$ = overlayRef
				.keydownEvents()
				.pipe(filter((event) => event.key === 'Escape'));
			this.globalSub.add(
				merge(escapeEvent$, outsideClick$).subscribe(() => {
					this.hide();
				}),
			);
		}

		this.globalSub.add(
			fromEvent(this.document, 'scroll', {
				capture: true,
				passive: true,
			}).subscribe((event) => {
				if (this.eventHappenedInsidePopover(event)) {
					return;
				}
				overlayRef.updatePosition();
			}),
		);
	}

	private eventHappenedInsidePopover(event: Event) {
		const popoverEl = this.popover().nativeElement;
		const target = event.target as Node;
		if (target) {
			if (target === popoverEl || popoverEl.contains(target)) {
				return true;
			}
		}
		return false;
	}

	private tryStretch() {
		untracked(() => {
			const origin = this.origin();
			if (this.stretchToOrigin() && origin) {
				this.popover().nativeElement.style.width =
					origin.el.offsetWidth + 'px';
			}
		});
	}

	private dispose() {
		this.overlayRef?.dispose();
		this.overlayRef = undefined;
		this.closed.emit();
		if (this.restoreFocus()) {
			this.origin()?.el.focus();
		}
	}

	private getOverlayPosition(
		position: POPOVER_POSITIONS_Y,
	): ConnectedPosition {
		switch (position) {
			case 'top':
				return {
					originX: 'center',
					originY: 'top',
					overlayX: 'center',
					overlayY: 'bottom',
					offsetX: this.offsetX(),
					offsetY: this.offsetY(),
				};
			case 'top-left':
				return {
					originX: 'end',
					originY: 'top',
					overlayX: 'end',
					overlayY: 'bottom',
					offsetX: 0,
					offsetY: 0,
				};
			case 'right':
				return {
					originX: 'end',
					originY: 'center',
					overlayX: 'start',
					overlayY: 'center',
					offsetX: this.offsetX(),
					offsetY: this.offsetY(),
				};
			case 'bottom':
				return {
					originX: 'center',
					originY: 'bottom',
					overlayX: 'center',
					overlayY: 'top',
					offsetX: this.offsetX(),
					offsetY: this.offsetY(),
				};
			case 'left':
				return {
					originX: 'start',
					originY: 'center',
					overlayX: 'end',
					overlayY: 'center',
					offsetX: this.offsetX(),
					offsetY: this.offsetY(),
				};
		}
	}

	ngOnDestroy(): void {
		this.dispose();
		this.globalSub?.unsubscribe();
	}
}
