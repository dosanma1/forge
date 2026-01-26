import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
	ChangeDetectionStrategy,
	Component,
	provideZonelessChangeDetection,
} from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MmcDrawerRef } from './drawer-ref';
import { MmcDrawer } from './drawer.component';

describe('DrawerComponent', () => {
	let component: MmcDrawer;
	let fixture: ComponentFixture<MmcDrawer>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcDrawer],
			providers: [
				provideNoopAnimations(),
				{
					provide: MmcDrawerRef,
					useValue: {},
				},
				provideZonelessChangeDetection(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcDrawer);
		component = fixture.componentInstance;
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
	it('should display title', async () => {
		component.title.set('Title');
		fixture.detectChanges();
		await fixture.whenStable();
		const titleElement = fixture.nativeElement.querySelector('h2');
		expect(titleElement).toBeTruthy();
		expect(titleElement.textContent.trim()).toBe('Title');
	});
	it('should display component', async () => {
		component.component = DrawerTestComponent;
		await fixture.whenStable();
		expect(fixture.nativeElement.textContent).toContain('I am component');
	});
});

@Component({
	template: ` <div>I am component</div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerTestComponent { }
