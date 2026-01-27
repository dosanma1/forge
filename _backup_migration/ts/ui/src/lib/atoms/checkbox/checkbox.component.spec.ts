import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
	ChangeDetectionStrategy,
	Component,
	DebugElement,
	provideZonelessChangeDetection,
	signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MmcCheckbox } from './checkbox.component';

describe('MmcCheckbox', () => {
	let fixture: ComponentFixture<CheckboxTestComponent>;
	let debugElement: DebugElement;
	let htmlElement: HTMLElement;
	let rootComponent: CheckboxTestComponent;
	let checkboxComponent: MmcCheckbox;
	let checkboxNativeElement: HTMLElement;
	let checkboxElement: HTMLElement;

	beforeEach(async () => {
		TestBed.configureTestingModule({
			imports: [CheckboxTestComponent],
			providers: [
				provideNoopAnimations(),
				provideZonelessChangeDetection(),
			],
		});
		fixture = TestBed.createComponent(CheckboxTestComponent);
		debugElement = fixture.debugElement;
		htmlElement = fixture.debugElement.nativeElement;
		rootComponent = fixture.componentInstance;

		fixture.detectChanges();
		await fixture.whenStable();

		const checkboxDebugElement = debugElement.query(By.directive(MmcCheckbox));
		checkboxComponent = checkboxDebugElement?.componentInstance as MmcCheckbox;
		checkboxElement = checkboxDebugElement?.nativeElement;
		checkboxNativeElement = checkboxElement;
	});

	it('should create', () => {
		expect(checkboxComponent).toBeTruthy();
	});
	it('should disable checkbox with disable true', async () => {
		rootComponent.disabled.set(true);
		fixture.detectChanges();
		await fixture.whenStable();
		expect(checkboxElement.getAttribute('disabled')).toBeDefined();
	});

	it('should be true on change', async () => {
		checkboxNativeElement.click();
		fixture.detectChanges();
		await fixture.whenStable();
		expect(rootComponent.formControl.value).toBeTruthy();
	});

	it('checkbox should be invalid with formControl required', async () => {
		rootComponent.formControl.setValidators(Validators.required);
		rootComponent.formControl.setValue(null);
		rootComponent.formControl.markAsTouched();
		fixture.detectChanges();
		await fixture.whenStable();
		expect(rootComponent.formControl.invalid).toBeTruthy();
	});
	it("ng-content should be 'Test checkbox'", async () => {
		// The text is in the label element, not inside the checkbox component
		const labelElement = htmlElement.querySelector('label');
		expect(labelElement?.textContent?.trim()).toBe('Test checkbox');
	});
});

@Component({
	imports: [MmcCheckbox, ReactiveFormsModule],
	template: `<label>
		<mmc-checkbox [formControl]="formControl" [disabled]="disabled()"></mmc-checkbox>
		Test checkbox
	</label>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class CheckboxTestComponent {
	formControl = new FormControl();
	disabled = signal(false);
}
