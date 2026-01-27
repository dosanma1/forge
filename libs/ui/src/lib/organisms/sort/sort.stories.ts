import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideCaseSensitive, lucideClock } from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { Field, SortComponent, SortField } from './sort.component';

@Component({
	selector: 'mmc-show-case-sort',
	template: `
		<mmc-sort
			[availableFields]="availableFields"
			[value]="value"
			(valueChange)="onValueChange($event)"
		></mmc-sort>
	`,
	imports: [SortComponent],
	providers: [provideIcons({ lucideClock, lucideCaseSensitive })],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowCaseSortComponent {
	availableFields: Field[] = [
		{ name: 'Created At', icon: 'lucideClock' },
		{ name: 'Name', icon: 'lucideCaseSensitive' },
	];
	value: SortField[] = [
		{
			field: { name: 'Created At', icon: 'lucideClock' },
			direction: 'ASC',
		},
		{ field: { name: 'Name', icon: 'lucideCaseSensitive' }, direction: 'DESC' },
	];

	onValueChange(sortFields: SortField[]): void {
		console.log(sortFields);
	}
}

const meta: Meta<ShowCaseSortComponent> = {
	title: 'Organisms/Sort',
	component: ShowCaseSortComponent,
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [ShowCaseSortComponent],
		}),
	],
};

export default meta;
type Story = StoryObj<ShowCaseSortComponent>;

export const Default: Story = {};
