import { Component } from '@angular/core';
import { NgpRadioItem } from 'ng-primitives/radio';

@Component({
	selector: 'mmc-radio-item',
	hostDirectives: [
		{
			directive: NgpRadioItem,
			inputs: [
				'ngpRadioItemValue:value',
				'ngpRadioItemDisabled:disabled',
			],
		},
	],
	template: `
		<div ngpRadioIndicator>
			<span class="indicator-dot"></span>
		</div>

		<p class="title">
			<ng-content />
		</p>
	`,
	styles: `
		:host {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			cursor: pointer;
			outline: none;
		}

		:host[data-disabled] {
			cursor: not-allowed;
			opacity: 0.5;
		}

		[ngpRadioIndicator] {
			display: inline-flex;
			justify-content: center;
			align-items: center;
			border-radius: 9999px;
			width: 1rem;
			height: 1rem;
			border: 1px solid oklch(var(--input));
			background-color: transparent;
			transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
		}

		:host[data-focus-visible] [ngpRadioIndicator] {
			outline: 2px solid oklch(var(--ring) / 0.7);
			outline-offset: 2px;
		}

		:host[data-checked] [ngpRadioIndicator] {
			border-color: oklch(var(--primary));
			background-color: oklch(var(--primary));
		}

		.indicator-dot {
			width: 0.375rem;
			height: 0.375rem;
			border-radius: 9999px;
			background-color: transparent;
			transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
		}

		:host[data-checked] .indicator-dot {
			background-color: oklch(var(--primary-foreground));
		}

		.title {
			font-size: 0.875rem;
			line-height: 1.25rem;
			font-weight: 400;
			color: oklch(var(--foreground));
			margin: 0;
		}
	`,
})
export class MmcRadioItem { }
