import { Attribute, IResource, Resource, ResourceConfig, ResourceProps } from 'ts-jsonapi';

export interface IPublisher extends IResource {
	Name(): string;
}

export type PublisherProps = Partial<ResourceProps> & {
	name: string;
};

@ResourceConfig({
	type: 'publishers'
})
export class Publisher extends Resource implements IPublisher {
	@Attribute()
	private name: string;

	constructor(props: Partial<PublisherProps>) {
		super(props);

		if (props) {
			// Attributes
			this.name = props.name;
		}
	}

	Name(): string {
		return this.name;
	}
}
