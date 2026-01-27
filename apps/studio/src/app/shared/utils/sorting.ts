import { QueryOption } from '@forge/ts-jsonapi';
import { Field, SortField } from '@forge/ui';

export const defaultAvailableSortingFields: Field[] = [
	{ name: 'Created At', icon: 'lucideCalendarPlus' },
	{ name: 'Name', icon: 'lucideCalendarPlus' },
];

// TODO: Query is missing the property sort to be able to sort Fields
export function mapSortFieldsToQueryOptions(
	sortingFields: SortField[],
): QueryOption[] {
	const opts: QueryOption[] = [];
	for (const sortField of sortingFields) {
		opts
			.push
			// Query.sortBy(sortField.field.name, sortField.direction)
			();
	}

	return opts;
}
