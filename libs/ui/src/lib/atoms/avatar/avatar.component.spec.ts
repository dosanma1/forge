import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcAvatar } from './avatar.component';

describe('AvatarComponent', () => {
	let component: MmcAvatar;
	let fixture: ComponentFixture<MmcAvatar>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcAvatar],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcAvatar);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
