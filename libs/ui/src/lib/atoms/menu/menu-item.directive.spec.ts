import { MENU_STACK, MenuStack } from '@angular/cdk/menu';
import { Component, DebugElement, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MmcMenuItem } from './menu-item.directive';

@Component({
	template: `<div mmcMenuItem>Test</div>`,
	imports: [MmcMenuItem],
})
class TestComponent { }

describe('ContextMenuItemDirective', () => {
	let component: TestComponent;
	let fixture: ComponentFixture<TestComponent>;
	let directive: MmcMenuItem;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestComponent],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: MENU_STACK, useClass: MenuStack },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(TestComponent);
		component = fixture.componentInstance;
		const debugElement: DebugElement = fixture.debugElement.query(
			By.directive(MmcMenuItem)
		);
		directive = debugElement.injector.get(MmcMenuItem);
		fixture.detectChanges();
	});

	it('should create an instance', () => {
		expect(directive).toBeTruthy();
	});
});
