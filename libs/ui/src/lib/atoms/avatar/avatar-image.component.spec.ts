import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcAvatarImage } from './avatar-image.component';
import { MmcAvatar } from './avatar.component';

@Component({
	template: `
		<mmc-avatar>
			<mmc-avatar-image src="test.jpg"></mmc-avatar-image>
		</mmc-avatar>
	`,
	imports: [MmcAvatar, MmcAvatarImage],
})
class TestWrapperComponent { }

describe('AvatarImageComponent', () => {
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
