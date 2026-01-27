import { ILink } from '@desktop-app/shared/types/link';
import { IPosition } from '@desktop-app/shared/types/position';
import {
	Attribute,
	IResource,
	NestedAttribute,
	Relationship,
	Resource,
	ResourceConfig,
	ResourceProps,
	Wrapped,
} from '@forge/ts-jsonapi';

export const ResourceTypeDashboard = 'dashboards';

export interface ITimepicker {
	refreshIntervals: string[];
	from: string;
	to: string;
}

export interface TimepickerProps {
	refreshIntervals: string[];
	from: string;
	to: string;
}

export class Timepicker implements ITimepicker {
	@Wrapped({ serializedName: 'refreshIntervals' })
	private _refreshIntervals: string[];

	@Wrapped({ serializedName: 'from' })
	private _from: string;

	@Wrapped({ serializedName: 'to' })
	private _to: string;

	constructor(props: Partial<TimepickerProps>) {
		if (props) {
			this._refreshIntervals = props.refreshIntervals;
			this._from = props.from;
			this._to = props.to;
		}
	}

	get refreshIntervals(): string[] {
		return this._refreshIntervals;
	}

	get from(): string {
		return this._from;
	}

	get to(): string {
		return this._to;
	}
}

export enum PanelKind {
	HISTOGRAM = 'HISTOGRAM',
}

export enum LegendKind {
	LIST = 'LIST',
	TABLE = 'TABLE',
}

export enum LegendPlacement {
	BOTTOM = 'BOTTOM',
	RIGHT = 'RIGHT',
}

export interface ITarget {
	resourceType: string;
	queryParams: Map<string, string>;
}

export interface TargetProps {
	resourceType: string;
	queryParams: Map<string, string>;
}

export class Target implements ITarget {
	@Wrapped({ serializedName: 'resourceType' })
	private _resourceType: string;

	@Wrapped({ serializedName: 'queryParams' })
	private _queryParams: Map<string, string>;

	constructor(props: Partial<TargetProps>) {
		if (props) {
			this._resourceType = props.resourceType;
			this._queryParams = props.queryParams;
		}
	}

	get resourceType(): string {
		return this._resourceType;
	}

	get queryParams(): Map<string, string> {
		return this._queryParams;
	}
}

export interface IGridPosition extends IPosition {
	height: number;
	width: number;
}

export interface ILegend {
	displayMode: LegendKind;
	placement: LegendPlacement;
}

export interface IOption {
	link: ILink;
	legend: ILegend;
}

export interface IPanel {
	title: string;
	description: string;
	kind: PanelKind;
	gridPosition: IGridPosition;
	options: IOption;
	targets: ITarget[];
}

export interface PanelProps {
	title: string;
	description: string;
	kind: PanelKind;
	gridPosition: IGridPosition;
	options: IOption;
	targets: Partial<TargetProps>[];
}

export class Panel implements IPanel {
	@Attribute({ serializedName: 'url' })
	private _title: string;

	@Attribute({ serializedName: 'description' })
	private _description: string;

	@Attribute({ serializedName: 'kind' })
	private _kind: PanelKind;

	@Attribute({ serializedName: 'gridPosition' })
	private _gridPosition: IGridPosition;

	@Attribute({ serializedName: 'options' })
	private _options: IOption;

	@NestedAttribute({ type: Target, serializedName: 'targets' })
	private _targets: ITarget[];

	constructor(props: Partial<PanelProps>) {
		if (props) {
			this._title = props.title;
			this._description = props.description;
			this._kind = props.kind;
			this._gridPosition = props.gridPosition;
			this._options = props.options;
			if (props.targets) {
				if (!this._targets) {
					this._targets = [];
				}
				for (const target of props.targets) {
					this._targets.push(new Target(target));
				}
			}
		}
	}

	get title(): string {
		return this._title;
	}

	get description(): string {
		return this._description;
	}

	get kind(): PanelKind {
		return this._kind;
	}

	get gridPosition(): IGridPosition {
		return this._gridPosition;
	}

	get options(): IOption {
		return this._options;
	}

	get targets(): ITarget[] {
		return this._targets;
	}
}

export interface IDashboard extends IResource {
	name: string;
	description: string;
	panels: IPanel[];
	timezone: string;
	timepicker: ITimepicker;
}

export interface DashboardProps extends Partial<ResourceProps> {
	name: string;
	description: string;
	panels: Partial<PanelProps>[];
	timezone: string;
	timepicker: Partial<TimepickerProps>;
}

@ResourceConfig({
	type: ResourceTypeDashboard,
})
export class Dashboard extends Resource implements IDashboard {
	@Attribute({ serializedName: 'name' })
	private _name: string;

	@Attribute({ serializedName: 'description' })
	private _description: string;

	@Attribute({ serializedName: 'timezone' })
	private _timezone: string;

	@NestedAttribute({ type: Timepicker, serializedName: 'timepicker' })
	private _timepicker: ITimepicker;

	@Relationship({ type: Panel, serializedName: 'panels' })
	private _panels: IPanel[];

	constructor(props: Partial<DashboardProps>) {
		super(props);
		if (props) {
			this._name = props.name;
			this._description = props.description;
			this._timezone = props.timezone;
			this._timepicker = new Timepicker(props.timepicker);
			if (props.panels) {
				if (!this._panels) {
					this._panels = [];
				}
				for (const panel of props.panels) {
					this._panels.push(new Panel(panel));
				}
			}
		}
	}

	get name(): string {
		return this._name;
	}

	get description(): string {
		return this._description;
	}

	get panels(): IPanel[] {
		return this._panels;
	}

	get timezone(): string {
		return this._timezone;
	}

	get timepicker(): ITimepicker {
		return this._timepicker;
	}
}
