import { Component, DebugElement, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MmcMenu } from './menu.directive';

@Component({
	template: `<div mmcMenu>Test</div>`,
	imports: [MmcMenu],
})
class TestComponent { }

describe('ContextMenuDirective', () => {
	let component: TestComponent;
	let fixture: ComponentFixture<TestComponent>;
	let directive: MmcMenu;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideAnimations(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(TestComponent);
		component = fixture.componentInstance;
		const debugElement: DebugElement = fixture.debugElement.query(
			By.directive(MmcMenu)
		);
		directive = debugElement.injector.get(MmcMenu);
		fixture.detectChanges();
	});

	it('should create an instance', () => {
		expect(directive).toBeTruthy();
	});
});
