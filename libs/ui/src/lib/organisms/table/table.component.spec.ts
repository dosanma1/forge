import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcTableComponent } from './table.component';

describe('TableComponent', () => {
	let component: MmcTableComponent<unknown>;
	let fixture: ComponentFixture<MmcTableComponent<unknown>>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MmcTableComponent],
			providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
		}).compileComponents();

		fixture = TestBed.createComponent(MmcTableComponent);
		component = fixture.componentInstance;

		// Set required inputs
		fixture.componentRef.setInput('dataSource', { data: [], totalCount: 0 });
		fixture.componentRef.setInput('columns', []);
		fixture.componentRef.setInput('pagination', { pageIndex: 0, pageSize: 10 });

		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
