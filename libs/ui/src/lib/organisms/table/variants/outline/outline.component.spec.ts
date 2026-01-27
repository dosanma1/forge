import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MmcTableComponent } from '../../table.component';
import { OutlineComponent } from './outline.component';

@Component({
  template: `
		<mmc-table [dataSource]="{ data: [], totalCount: 0 }" [columns]="[]" [pagination]="{ pageIndex: 0, pageSize: 10 }">
			<mmc-table-outline></mmc-table-outline>
		</mmc-table>
	`,
  imports: [MmcTableComponent, OutlineComponent],
})
class TestWrapperComponent { }

describe('OutlineComponent', () => {
  let component: TestWrapperComponent;
  let fixture: ComponentFixture<TestWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestWrapperComponent],
      providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TestWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
