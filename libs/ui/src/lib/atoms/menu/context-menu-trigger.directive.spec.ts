import { MENU_STACK, MenuStack } from '@angular/cdk/menu';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MmcContextMenuTrigger } from './context-menu-trigger.directive';

describe('ContextMenuTriggerDirective', () => {
	let fixture: ComponentFixture<TestComponent>;
	let component: TestComponent;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideAnimations(),
				{ provide: MENU_STACK, useClass: MenuStack },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(TestComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create an instance', () => {
		expect(component).toBeTruthy();
	});
});

@Component({
	template: '<div mmcContextMenuTrigger>Test</div>',
	imports: [MmcContextMenuTrigger],
})
class TestComponent { }
