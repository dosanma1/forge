import {
	ChangeDetectionStrategy,
	Component,
	TemplateRef,
	ViewChild,
	input,
	model,
} from '@angular/core';

export interface AccordionAction {
	icon: string;
	tooltip: string;
	onClick: () => void;
}

@Component({
	selector: 'mmc-accordion-section',
	standalone: true,
	template: '<ng-template #sectionContent><ng-content></ng-content></ng-template>',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmcAccordionSection {
	/** Unique identifier for the section */
	public readonly id = input.required<string>();

	/** Section title displayed in the header */
	public readonly title = input.required<string>();

	/** Optional icon to display before the title */
	public readonly icon = input<string>();

	/** Whether the section is expanded (two-way bindable) */
	public readonly expanded = model<boolean>(true);

	/** Optional action buttons in the header */
	public readonly actions = input<AccordionAction[]>();

	/** Reference to the content template for parent to render */
	@ViewChild('sectionContent', { static: true })
	private _templateRef!: TemplateRef<unknown>;

	/** Get the template ref for the parent to render */
	public templateRef(): TemplateRef<unknown> {
		return this._templateRef;
	}
}
