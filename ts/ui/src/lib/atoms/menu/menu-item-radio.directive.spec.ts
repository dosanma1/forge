import { MENU_STACK, MenuStack } from '@angular/cdk/menu';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MmcMenuItemRadio } from './menu-item-radio.directive';

describe('MenuItemRadioDirective', () => {
	let fixture: ComponentFixture<TestComponent>;
	let component: TestComponent;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
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
	template: '<div mmcMenuItemRadio>Test</div>',
	imports: [MmcMenuItemRadio],
})
class TestComponent { }
