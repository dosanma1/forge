import {
	animate,
	AnimationBuilder,
	AnimationPlayer,
	style,
} from '@angular/animations';
import { CdkMenu } from '@angular/cdk/menu';
import {
	computed,
	Directive,
	ElementRef,
	inject,
	input,
	OnDestroy,
} from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

@Directive({
	selector: '[mmcMenu]',
	hostDirectives: [CdkMenu],
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcMenu implements OnDestroy {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected classNames = computed(() =>
		cn(
			'rounded-lg border border-border bg-background shadow-lg shadow-foreground/5 divide-y [&>div]:p-1',
			this.additionalClasses(),
		),
	);

	private animationBuilder = inject(AnimationBuilder);
	private player!: AnimationPlayer;
	private host = inject(ElementRef);
	private animation = this.animationBuilder.build([
		style({ transform: 'scale(0)', opacity: 0 }),
		animate('150ms', style({ opacity: 1, transform: 'scale(1)' })),
	]);

	constructor() {
		this.enter();
	}

	private enter() {
		this.player = this.animation.create(this.host.nativeElement);
		this.player.play();
	}

	ngOnDestroy(): void {
		this.player.destroy();
	}
}
