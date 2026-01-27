import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MmcConfirmationDialog } from './confirmation-dialog.component';

describe('MmcConfirmationDialog', () => {
	let component: MmcConfirmationDialog;
	let fixture: ComponentFixture<MmcConfirmationDialog>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcConfirmationDialog],
			providers: [provideZonelessChangeDetection()]
		}).compileComponents();

		fixture = TestBed.createComponent(MmcConfirmationDialog);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should set title', () => {
		const title = 'Test Title';
		component.setTitle(title);
		expect(component.title()).toBe(title);
	});

	it('should set description', () => {
		const description = 'Test Description';
		component.setDescription(description);
		expect(component.description()).toBe(description);
	});

	it('should toggle header visibility', () => {
		component.setShowHeader(false);
		expect(component.showHeader()).toBe(false);

		component.setShowHeader(true);
		expect(component.showHeader()).toBe(true);
	});

	it('should toggle footer visibility', () => {
		component.setShowFooter(true);
		expect(component.showFooter()).toBe(true);

		component.setShowFooter(false);
		expect(component.showFooter()).toBe(false);
	});

	it('should set confirm text', () => {
		const confirmText = 'Delete';
		component.setConfirmText(confirmText);
		expect(component.confirmText()).toBe(confirmText);
	});

	it('should set cancel text', () => {
		const cancelText = 'Abort';
		component.setCancelText(cancelText);
		expect(component.cancelText()).toBe(cancelText);
	});

	it('should set variant', () => {
		component.setVariant('destructive');
		expect(component.variant()).toBe('destructive');

		component.setVariant('default');
		expect(component.variant()).toBe('default');
	});
});
