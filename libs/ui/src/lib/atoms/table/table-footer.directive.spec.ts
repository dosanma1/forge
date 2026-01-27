import { Component, DebugElement, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MmcTableFooter } from './table-footer.directive';

@Component({
	template: `<tfoot mmcTableFooter>Test</tfoot>`,
	imports: [MmcTableFooter],
})
class TestComponent { }

describe('TableFooterDirective', () => {
	let component: TestComponent;
	let fixture: ComponentFixture<TestComponent>;
	let directive: MmcTableFooter;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestComponent],
			providers: [provideZonelessChangeDetection()],
		}).compileComponents();

		fixture = TestBed.createComponent(TestComponent);
		component = fixture.componentInstance;
		const debugElement: DebugElement = fixture.debugElement.query(
			By.directive(MmcTableFooter)
		);
		directive = debugElement.injector.get(MmcTableFooter);
		fixture.detectChanges();
	});

	it('should create an instance', () => {
		expect(directive).toBeTruthy();
	});
});
