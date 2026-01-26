import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcAvatarFallback } from './avatar-fallback.component';
import { MmcAvatar } from './avatar.component';

@Component({
	template: `
		<mmc-avatar>
			<mmc-avatar-fallback></mmc-avatar-fallback>
		</mmc-avatar>
	`,
	imports: [MmcAvatar, MmcAvatarFallback],
})
class TestWrapperComponent { }

describe('AvatarFallbackComponent', () => {
	let component: TestWrapperComponent;
	let fixture: ComponentFixture<TestWrapperComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestWrapperComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(TestWrapperComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
