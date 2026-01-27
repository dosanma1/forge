import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MmcConfirmationDialogClose } from './confirmation-dialog-close.directive';
import { MmcConfirmationDialogRef } from './confirmation-dialog-ref';

@Component({
	template: '<button mmcConfirmationDialogClose>Close</button>',
	imports: [MmcConfirmationDialogClose],
})
class TestComponent { }

describe('MmcConfirmationDialogClose', () => {
	let component: TestComponent;
	let fixture: ComponentFixture<TestComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
				{
					provide: MmcConfirmationDialogRef,
					useValue: { close: jasmine.createSpy('close') },
				},
			],
		}).compileComponents();

		fixture = TestBed.createComponent(TestComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
