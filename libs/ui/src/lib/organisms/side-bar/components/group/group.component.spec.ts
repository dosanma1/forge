import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { NavigationItem } from '../../../../../navigation/navigation.types';
import { SideBarComponent } from '../../side-bar.component';
import { GroupComponent } from './group.component';

// Create a mock class that matches what SideBarComponent should provide
class MockSideBarComponent {
	isOpened = true;
}

describe('GroupComponent', () => {
	let component: GroupComponent;
	let fixture: ComponentFixture<GroupComponent>;

	const mockNavigationItem: NavigationItem = {
		type: 'group',
		title: 'Test Group',
		icon: 'lucideTrafficCone',
		children: [
			{
				type: 'basic',
				title: 'Child Item',
				link: '/test-child',
				icon: 'lucideTrafficCone'
			}
		]
	};

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [GroupComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
				provideRouter([]), // Provide empty router configuration
				{
					provide: SideBarComponent,
					useClass: MockSideBarComponent
				},
				{
					provide: ActivatedRoute,
					useValue: {
						snapshot: {
							params: {},
							queryParams: {},
						},
					},
				},
			],
		}).compileComponents();

		fixture = TestBed.createComponent(GroupComponent);
		component = fixture.componentInstance;

		// Set the required input
		fixture.componentRef.setInput('item', mockNavigationItem);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
