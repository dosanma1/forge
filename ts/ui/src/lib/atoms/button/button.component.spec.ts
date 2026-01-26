import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
	ChangeDetectionStrategy,
	Component,
	DebugElement,
	input,
	provideZonelessChangeDetection,
	signal,
} from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MmcButton } from './button.component';

describe('ButtonComponent', () => {
	let fixture: ComponentFixture<ButtonTestComponent>;
	let debugElement: DebugElement;
	let htmlElement: HTMLElement;
	let rootComponent: ButtonTestComponent;
	let buttonComponent: MmcButton;
	let buttonRootElement: HTMLElement;

	beforeEach(async () => {
		TestBed.configureTestingModule({
			imports: [ButtonTestComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
			],
		});
		fixture = TestBed.createComponent(ButtonTestComponent);
		fixture.detectChanges();
		await fixture.whenStable();

		debugElement = fixture.debugElement;
		htmlElement = fixture.debugElement.nativeElement;
		rootComponent = fixture.componentInstance;
		buttonComponent = debugElement.query(By.directive(MmcButton))
			.componentInstance as MmcButton;
		buttonRootElement = htmlElement.querySelector('button') as HTMLElement;
	});

	it('should create', () => {
		expect(buttonComponent).toBeTruthy();
	});

	it('should add disable attribute on disable', async () => {
		rootComponent.disabled.set(true);
		fixture.detectChanges();
		await fixture.whenStable();
		expect(buttonRootElement.classList.contains('opacity-50')).toBeTrue();
		expect(buttonRootElement.classList.contains('cursor-not-allowed')).toBeTrue();
	});

	it('should add outline class on variant type change', async () => {
		rootComponent.variant.set('outline');
		fixture.detectChanges();
		await fixture.whenStable();
		expect(buttonRootElement.classList.contains('border')).toBeTrue();
		expect(buttonRootElement.classList.contains('border-input')).toBeTrue();
	});

	it('should add proper variant type', async () => {
		rootComponent.variant.set('secondary');
		await fixture.whenStable();
		expect(buttonRootElement.classList).toContain('bg-secondary');
	});

	it('should add proper button type', async () => {
		rootComponent.type.set('submit');
		await fixture.whenStable();
		expect(buttonRootElement.getAttribute('type')).toBe('submit');
	});

	it('should show spinner on loading', async () => {
		rootComponent.loading.set(true);
		fixture.detectChanges();
		await fixture.whenStable();
		const hasSpinner = buttonRootElement.querySelector('mmc-spinner') !== null;
		expect(hasSpinner).toBeTrue();
	});

	it('should display text in button', () => {
		expect(buttonRootElement.textContent?.trim()).toBe('Test Button');
	});

	it('should change the size class', async () => {
		fixture.componentRef.setInput('size', 'lg');
		fixture.detectChanges();
		await fixture.whenStable();
		expect(buttonRootElement.classList.contains('h-9')).toBeTrue();
		expect(buttonRootElement.classList.contains('px-7')).toBeTrue();
	});
});

@Component({
	imports: [MmcButton],
	template: `<button
		mmcButton
		[variant]="variant()"
		[disabled]="disabled()"
		[type]="type()"
		[loading]="loading()"
		[size]="size()"
	>
		Test Button
	</button>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class ButtonTestComponent {
	disabled = signal<boolean>(false);
	variant = signal<string | undefined>('default');
	type = signal<string>('button');
	loading = signal(false);
	size = input<string>('sm');
}
