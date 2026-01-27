import { IResource } from '../resource';

export const assertEqualResource = (want: IResource, got: IResource): void => {
    if (!want) {
        expect(got).not.toBeDefined();
        return;
    }

    expect(want.ID()).toBe(got.ID());
};
