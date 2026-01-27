import { Directive, inject, TemplateRef } from '@angular/core';

@Directive({
	selector: 'ng-template[mmcSelectLabel]',
})
export class SelectLabelDirective {
	templateRef = inject(TemplateRef<unknown>);
}
