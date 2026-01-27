import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainContentLayoutComponent } from './main-content-layout.component';

describe('MainContentLayoutComponent', () => {
	let component: MainContentLayoutComponent;
	let fixture: ComponentFixture<MainContentLayoutComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MainContentLayoutComponent],
		
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

		fixture = TestBed.createComponent(MainContentLayoutComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
