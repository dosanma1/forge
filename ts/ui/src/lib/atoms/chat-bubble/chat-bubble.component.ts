import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
} from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

type Direction = 'incoming' | 'outgoing';

@Component({
	selector: 'mmc-chat-bubble',
	templateUrl: './chat-bubble.component.html',
	imports: [NgTemplateOutlet, NgClass, DatePipe],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcChatBubble {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	readonly direction = input.required<Direction | string>();
	readonly tail = input<boolean>(true);
	readonly time = input<string | number | Date>();

	protected classNames = computed(() => cn('', this.additionalClasses()));

	get incomingMsg(): boolean {
		return this.direction() === 'incoming';
	}

	get outgoingMsg(): boolean {
		return this.direction() === 'outgoing';
	}
}
