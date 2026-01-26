import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcChatBubble } from './chat-bubble.component';

describe('ChatBubbleComponent', () => {
	let component: MmcChatBubble;
	let fixture: ComponentFixture<MmcChatBubble>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcChatBubble],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcChatBubble);
		component = fixture.componentInstance;

		// Set required input
		fixture.componentRef.setInput('direction', 'incoming');

		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
