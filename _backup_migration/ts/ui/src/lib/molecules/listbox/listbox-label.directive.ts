import { Directive, inject, TemplateRef } from '@angular/core';

@Directive({
	selector: 'ng-template[mmcListboxLabel]',
})
export class ListboxLabelDirective {
	templateRef = inject(TemplateRef<unknown>);
}
