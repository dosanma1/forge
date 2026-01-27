import {
	Attribute,
	IResource,
	Resource,
	ResourceConfig,
	ResourceProps,
} from '@forge/ts-jsonapi';

export const ResourceTypeProject = 'projects';

export interface IProject extends IResource {
	name: string;
	description: string;
	imageURL: string;
	path: string;
}

export interface ProjectProps extends Partial<ResourceProps> {
	name: string;
	description: string;
	imageURL: string;
	path: string;
}

export type ProjectOption = (project: Project) => void;

@ResourceConfig({
	type: ResourceTypeProject,
})
export class Project extends Resource implements IProject {
	@Attribute({ serializedName: 'name' })
	private _name: string;

	@Attribute({ serializedName: 'description' })
	private _description: string;

	@Attribute({ serializedName: 'imageURL' })
	private _imageURL: string;

	@Attribute({ serializedName: 'path' })
	private _path: string;

	constructor(props: Partial<ProjectProps>) {
		super(props);
		if (props) {
			this._name = props.name;
			this._description = props.description;
			this._imageURL = props.imageURL;
			this._path = props.path;
		}
	}

	static Update(
		project: IProject,
		...opts: ProjectOption[]
	): Project {
		const updated = new Project({
			...Resource.toProps(project),
			name: project.name,
			description: project.description,
			imageURL: project.imageURL,
			path: project.path,
		});
		for (const opt of opts) {
			opt(updated);
		}
		return updated;
	}

	static WithName(name: string): ProjectOption {
		return (project: Project) => {
			project._name = name;
		};
	}

	static WithDescription(description: string): ProjectOption {
		return (project: Project) => {
			project._description = description;
		};
	}

	static WithImageURL(imageURL: string): ProjectOption {
		return (project: Project) => {
			project._imageURL = imageURL;
		};
	}

	static WithPath(path: string): ProjectOption {
		return (project: Project) => {
			project._path = path;
		};
	}

	get name(): string {
		return this._name;
	}

	get description(): string {
		return this._description;
	}

	get imageURL(): string {
		return this._imageURL;
	}

	get path(): string {
		return this._path;
	}
}
