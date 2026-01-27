import { Component, DebugElement, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MmcTableCell } from './table-cell.directive';

@Component({
	template: `<td mmcTableCell>Test</td>`,
	imports: [MmcTableCell],
})
class TestComponent { }

describe('TableCellDirective', () => {
	let component: TestComponent;
	let fixture: ComponentFixture<TestComponent>;
	let directive: MmcTableCell;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestComponent],
			providers: [provideZonelessChangeDetection()],
		}).compileComponents();

		fixture = TestBed.createComponent(TestComponent);
		component = fixture.componentInstance;
		const debugElement: DebugElement = fixture.debugElement.query(
			By.directive(MmcTableCell)
		);
		directive = debugElement.injector.get(MmcTableCell);
		fixture.detectChanges();
	});

	it('should create an instance', () => {
		expect(directive).toBeTruthy();
	});
});
