import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { NavigationItem } from '../../../../../navigation/navigation.types';
import { SideBarComponent } from '../../side-bar.component';
import { BasicComponent } from './basic.component';

// Create a mock class that matches what SideBarComponent should provide
class MockSideBarComponent {
  isOpened = true;
}

describe('BasicComponent', () => {
  let component: BasicComponent;
  let fixture: ComponentFixture<BasicComponent>;

  const mockNavigationItem: NavigationItem = {
    type: 'basic',
    title: 'Test Basic Item',
    link: '/test',
    icon: 'lucideTrafficCone'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicComponent],
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
    })
      .compileComponents();

    fixture = TestBed.createComponent(BasicComponent);
    component = fixture.componentInstance;

    // Set the required input
    fixture.componentRef.setInput('item', mockNavigationItem);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
