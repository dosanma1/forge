import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MmcRadioGroup } from './radio-group.component';
import { MmcRadioItem } from './radio-item.component';

@Component({
	template: `
		<mmc-radio-group>
			<mmc-radio-item value="test">Test Radio</mmc-radio-item>
		</mmc-radio-group>
	`,
	imports: [MmcRadioGroup, MmcRadioItem],
})
class TestWrapperComponent { }

describe('MmcRadio', () => {
	let component: TestWrapperComponent;
	let fixture: ComponentFixture<TestWrapperComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestWrapperComponent],
			providers: [provideZonelessChangeDetection(), provideNoopAnimations()]
		}).compileComponents();

		fixture = TestBed.createComponent(TestWrapperComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
