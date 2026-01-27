import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MmcInputSearch } from './input-search.component';

describe('MmcInputSearch', () => {
	let component: MmcInputSearch;
	let fixture: ComponentFixture<MmcInputSearch>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcInputSearch],
			providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcInputSearch);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
