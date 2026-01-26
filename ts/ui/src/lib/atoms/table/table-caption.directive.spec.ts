import { Component, DebugElement, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MmcTableCaption } from './table-caption.directive';

@Component({
	template: `<caption mmcTableCaption>Test</caption>`,
	imports: [MmcTableCaption],
})
class TestComponent { }

describe('TableCaptionDirective', () => {
	let component: TestComponent;
	let fixture: ComponentFixture<TestComponent>;
	let directive: MmcTableCaption;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestComponent],
			providers: [provideZonelessChangeDetection()],
		}).compileComponents();

		fixture = TestBed.createComponent(TestComponent);
		component = fixture.componentInstance;
		const debugElement: DebugElement = fixture.debugElement.query(
			By.directive(MmcTableCaption)
		);
		directive = debugElement.injector.get(MmcTableCaption);
		fixture.detectChanges();
	});

	it('should create an instance', () => {
		expect(directive).toBeTruthy();
	});
});
