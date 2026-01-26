import { IPublisher } from '../models/publisher.model';
import { assertEqualResource } from './test-helpers';

export const assertEqualPublisher = (
	want: IPublisher,
	got: IPublisher,
): void => {
	if (!want) {
		expect(got).not.toBeDefined();
		return;
	}

	assertEqualResource(want, got);
	expect(want.Name()).toBe(got.Name());
};

export const assertEqualPublishers = (
	want: IPublisher[],
	got: IPublisher[],
): void => {
	if (!want) {
		expect(got).not.toBeDefined();
		return;
	}
	expect(want.length).toBe(got.length);
	for (let i = 0; i <= want.length; i++) {
		assertEqualPublisher(want[i], got[i]);
	}
};
