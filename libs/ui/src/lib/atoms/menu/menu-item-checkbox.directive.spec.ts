import { CdkMenuModule } from '@angular/cdk/menu';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MmcMenuItemCheckbox } from './menu-item-checkbox.directive';

@Component({
	template: `
		<div cdkMenu>
			<button mmcMenuItemCheckbox>Test</button>
		</div>
	`,
	imports: [MmcMenuItemCheckbox, CdkMenuModule],
})
class TestComponent { }

describe('MenuItemCheckboxDirective', () => {
	let fixture: ComponentFixture<TestComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestComponent],
			providers: [provideZonelessChangeDetection()],
		}).compileComponents();

		fixture = TestBed.createComponent(TestComponent);
		fixture.detectChanges();
	});

	it('should create an instance', () => {
		const button = fixture.nativeElement.querySelector('button');
		expect(button).toBeTruthy();
	});
});
