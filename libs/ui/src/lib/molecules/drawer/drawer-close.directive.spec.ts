import { DOCUMENT } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	provideZonelessChangeDetection,
	signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MmcDrawerClose } from './drawer-close.directive';
import { MmcDrawerService } from './drawer.service';

describe('DrawerCloseDirective', () => {
	let fixture: ComponentFixture<DrawerCloseRootTestComponent>;
	let service: MmcDrawerService;
	let document: Document;

	function getDrawerCloseElement() {
		return document.querySelector('button') as HTMLElement;
	}

	function getDrawerTestElement() {
		return document.querySelector('mmc-drawer-test') as HTMLElement;
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [MmcDrawerClose, DrawerCloseTestComponent],
			providers: [
				provideNoopAnimations(),
				provideZonelessChangeDetection(),
			],
		}).compileComponents();
		document = TestBed.inject(DOCUMENT);
		service = TestBed.inject(MmcDrawerService);
		fixture = TestBed.createComponent(DrawerCloseRootTestComponent);
	});

	it('should close the drawer on DrawerCloseDirective click', async () => {
		const drawerRef = service.open(DrawerCloseTestComponent);
		await fixture.whenStable();
		expect(getDrawerTestElement()).toBeTruthy();
		getDrawerCloseElement().dispatchEvent(new Event('click'));
		await fixture.whenStable();
		drawerRef.closed.subscribe((value) => {
			expect(value).toBe('test');
		});
		expect(getDrawerTestElement()).toBeFalsy();
	});
});

@Component({
	template: ``,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerCloseRootTestComponent { }

@Component({
	selector: 'mmc-drawer-test',
	imports: [MmcDrawerClose],
	template: `<div>
		Drawer test {{ data }} <button [mmcDrawerClose]="value()">Close</button>
	</div>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DrawerCloseTestComponent {
	value = signal('test');
}
