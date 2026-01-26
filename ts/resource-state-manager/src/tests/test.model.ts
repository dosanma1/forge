import { Resource, ResourceConfig, ResourceProps } from 'ts-jsonapi';

const ResourceTypeTest = 'test';

export type TestResourceProps = Partial<ResourceProps>;

@ResourceConfig({
	type: ResourceTypeTest,
})
export class TestResource extends Resource {
	constructor(props: Partial<TestResourceProps>) {
		super(props);
	}
}
