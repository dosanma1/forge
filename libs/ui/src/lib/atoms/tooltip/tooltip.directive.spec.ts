import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgpOverlay } from 'ng-primitives/portal';
import { MmcTooltip } from './tooltip.directive';

// Mock NgpOverlay for testing
class MockNgpOverlay {
	isOpen = () => false;
	position = () => ({ x: 0, y: 0 });
	transformOrigin = () => 'top left';
	isPositioned = () => true;
	triggerWidth = () => 100;
	finalPlacement = () => 'top';
	id = signal('tooltip-id');
	cancelPendingClose = () => { };
	hide = () => { };
}

describe('MmcTooltip', () => {
	let fixture: ComponentFixture<TestComponent>;
	let component: TestComponent;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
				{ provide: NgpOverlay, useClass: MockNgpOverlay },
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
	template: '<div mmcTooltip="Test tooltip">Hover me</div>',
	imports: [MmcTooltip],
})
class TestComponent { }
