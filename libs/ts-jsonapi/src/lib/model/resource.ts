import { NestedAttribute } from '../decorators/nested-attribute.decorator';
import { Wrapped } from '../decorators/wrapped.decorator';

export interface IResource extends IIdentifier, ITimestamps {}

export interface IIdentifier {
	ID(): string;
	Type(): string;
}

interface ITimestamps {
	CreatedAt(): Date;
	UpdatedAt(): Date;
	DeletedAt(): Date | null;
}

export interface TimestampsProps {
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

export type TimestampsOption = (t: Timestamps) => void;

export class Timestamps implements ITimestamps {
	@Wrapped()
	createdAt: Date;

	@Wrapped()
	updatedAt: Date;

	@Wrapped()
	deletedAt?: Date;

	constructor(props?: Partial<TimestampsProps>, ...opts: TimestampsOption[]) {
		if (props) {
			this.createdAt = props.createdAt;
			this.updatedAt = props.updatedAt;
			this.deletedAt = props.deletedAt;
		}

		for (const opt of opts) {
			opt(this);
		}
	}

	static toProps(timestamps: ITimestamps): TimestampsProps {
		return {
			createdAt: timestamps.CreatedAt(),
			updatedAt: timestamps.UpdatedAt(),
			deletedAt: timestamps.DeletedAt(),
		};
	}

	// static update(timestamps: ITimestamps, ...opts: TimestampsOption[]): Timestamps {
	//   const timestampsProps: TimestampsProps = this.timestampsToProps(timestamps);
	//   const updateTimestamps = new Timestamps(timestampsProps);

	//   for (const opt of opts) {
	//     opt(updateTimestamps);
	//   }

	//   return updateTimestamps;
	// }

	static withCreatedAt(createdAt: Date): TimestampsOption {
		return (t: Timestamps) => {
			t.createdAt = createdAt;
		};
	}

	static withUpdatedAt(updatedAt: Date): TimestampsOption {
		return (t: Timestamps) => {
			t.updatedAt = updatedAt;
		};
	}

	static withDeletedAt(deletedAt: Date): TimestampsOption {
		return (t: Timestamps) => {
			t.deletedAt = deletedAt;
		};
	}

	CreatedAt(): Date {
		return this.createdAt;
	}

	UpdatedAt(): Date {
		return this.updatedAt;
	}

	DeletedAt(): Date {
		return this.deletedAt;
	}
}

export interface ResourceProps {
	id: string;
	type: string;
	timestamps?: TimestampsProps;
}

export type ResourceOption = (r: Resource) => void;

export class Resource implements IResource {
	id: string;
	type: string;

	meta: any;

	@NestedAttribute({ type: Timestamps })
	timestamps: Timestamps;

	constructor(props?: Partial<ResourceProps>, ...opts: ResourceOption[]) {
		if (props) {
			this.id = props.id ? props.id : undefined;
			this.type = props.type;
			if (props.timestamps) {
				this.timestamps = new Timestamps({
					createdAt: props.timestamps.createdAt,
					updatedAt: props.timestamps.createdAt,
					deletedAt: props.timestamps.deletedAt
						? props.timestamps.deletedAt
						: undefined,
				});
			}
		}

		for (const opt of opts) {
			opt(this);
		}
	}

	static toProps(res: IResource): ResourceProps {
		return {
			id: res.ID(),
			type: res.Type(),
			timestamps: Timestamps.toProps(res),
		};
	}

	// static update(res: IResource, ...opts: ResourceOption[]): Resource {
	//   const resourceProps: ResourceProps = this.resourceToProps(res);
	//   const updateArticle = new Resource(resourceProps);

	//   for (const opt of opts) {
	//     opt(updateArticle);
	//   }

	//   return updateArticle;
	// }

	static withResource(res: IResource): ResourceOption {
		return (r: Resource) => {
			r.id = res.ID();
			r.type = res.Type();
			r.timestamps = new Timestamps(
				null,
				Timestamps.withCreatedAt(res.CreatedAt()),
				Timestamps.withUpdatedAt(res.UpdatedAt()),
				Timestamps.withDeletedAt(res.DeletedAt()),
			);
		};
	}

	static withID(id: string): ResourceOption {
		return (r: Resource) => {
			r.id = id;
		};
	}

	static withType(type: string): ResourceOption {
		return (r: Resource) => {
			r.type = type;
		};
	}

	static withTimestamps(...opts: TimestampsOption[]): ResourceOption {
		return (r: Resource) => {
			r.timestamps = new Timestamps(null, ...opts);
		};
	}

	ID(): string {
		return this.id;
	}

	Type(): string {
		return this.type;
	}

	CreatedAt(): Date {
		if (!this.timestamps) return null;
		return this.timestamps.createdAt;
	}

	UpdatedAt(): Date {
		if (!this.timestamps) return null;
		return this.timestamps.updatedAt;
	}

	DeletedAt(): Date {
		if (!this.timestamps) return null;
		return this.timestamps.deletedAt;
	}
}

export class WrappedResource {
	[key: string]: any;

	constructor(data?: any) {
		if (data) {
			Object.assign(this, data);
		}
	}
}
