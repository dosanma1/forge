import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcTableComponent } from '../../table.component';
import { PrimaryComponent } from './primary.component';

@Component({
	template: `
		<mmc-table [dataSource]="{ data: [], totalCount: 0 }" [columns]="[]" [pagination]="{ pageIndex: 0, pageSize: 10 }">
			<mmc-table-primary></mmc-table-primary>
		</mmc-table>
	`,
	imports: [MmcTableComponent, PrimaryComponent],
})
class TestWrapperComponent { }

describe('PrimaryComponent', () => {
	let component: TestWrapperComponent;
	let fixture: ComponentFixture<TestWrapperComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TestWrapperComponent],
			providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
		}).compileComponents();

		fixture = TestBed.createComponent(TestWrapperComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
