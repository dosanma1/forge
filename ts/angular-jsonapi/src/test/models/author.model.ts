import { Attribute, IResource, Resource, ResourceConfig, ResourceProps } from 'ts-jsonapi';

export interface IAuthor extends IResource {
	Name(): string;
}

export type AuthorProps = Partial<ResourceProps> & {
	name: string;
};

@ResourceConfig({
	type: 'authors'
})
export class Author extends Resource implements IAuthor {
	@Attribute()
	private name: string;

	constructor(props: Partial<AuthorProps>) {
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
