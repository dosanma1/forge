import { IAuthor } from '../models/author.model';
import { assertEqualResource } from './test-helpers';

export const assertEqualAuthor = (want: IAuthor, got: IAuthor): void => {
    if (!want) {
        expect(got).not.toBeDefined();
        return;
    }

    assertEqualResource(want, got);
    expect(want.Name()).toBe(got.Name());
};

export const assertEqualAuthors = (want: IAuthor[], got: IAuthor[]): void => {
    if (!want) {
        expect(got).not.toBeDefined();
        return;
    }
    expect(want.length).toBe(got.length);
    for (let i = 0; i <= want.length; i++) {
        assertEqualAuthor(want[i], got[i]);
    }
};
