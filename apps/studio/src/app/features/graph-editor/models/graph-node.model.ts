export const ResourceTypeDialogueNode = 'dialogue-nodes';
export const ResourceTypeDialogueGraph = 'dialogue-graphs';

export enum ConditionType {
	Unknown = 'UNKNOWN',
	TextArray = 'TEXT_ARRAY',
	Unconditional = 'UNCONDITIONAL',
	File = 'FILE',
	FormReply = 'FORM_REPLY',
	Order = 'ORDER',
	Onboarding = 'ONBOARDING',
	Boolean = 'BOOLEAN',
	Number = 'NUMBER',
	Regex = 'REGEX',
}

export enum ActionType {
	Text = 'TEXT',
	ExecuteCode = 'EXECUTE_CODE',
	Transition = 'TRANSITION',
	OpenChildGraph = 'OPEN_CHILD_GRAPH',
	FillVariable = 'FILL_VARIABLE',
}

export interface IDialogueNodeActionData {
	type: ActionType;
	graphID?: string;
}

export interface TransitionOption {
	id: string;
	label: string;
	nextNodeId?: string;
}

export interface IDialogueNodeAction {
	id?: string;
	type: ActionType;
	data?: IDialogueNodeActionData;
	label?: string;
	content?: string; // For TEXT type - the message content
	options?: TransitionOption[]; // For TRANSITION type - sub-options with handles
	canHaveSourceHandler(): boolean;
}

export class DialogueNodeAction implements IDialogueNodeAction {
	id?: string;
	type: ActionType;
	data?: IDialogueNodeActionData;
	label?: string;
	content?: string;
	options?: TransitionOption[];

	constructor(props: Partial<IDialogueNodeAction>) {
		this.id = props.id || crypto.randomUUID();
		this.type = props.type || ActionType.ExecuteCode;
		this.data = props.data;
		this.label = props.label;
		this.content = props.content;
		this.options = props.options;
	}

	canHaveSourceHandler(): boolean {
		return (
			this.type === ActionType.OpenChildGraph ||
			this.type === ActionType.Transition
		);
	}
}

export interface DialogueNodeCondition {
	condition: ConditionType;
	variableName?: string;
	operator?: string;
	value?: unknown;
}

export interface Option {
	id?: string;
	label?: string;
	condition?: DialogueNodeCondition;
	nextNodeID?: string;
}

export interface IDialogueGraph {
	id: string;
	name: string;
	description: string;
	positionX?: number;
	positionY?: number;
	ID(): string;
}

export class DialogueGraph implements IDialogueGraph {
	id: string;
	name: string;
	description: string;
	positionX: number;
	positionY: number;

	constructor(props: Partial<IDialogueGraph>) {
		this.id = props.id || crypto.randomUUID();
		this.name = props.name || '';
		this.description = props.description || '';
		this.positionX = props.positionX || 0;
		this.positionY = props.positionY || 0;
	}

	ID(): string {
		return this.id;
	}
}

export interface IDialogueNode {
	id: string;
	name: string;
	description: string;
	actions: IDialogueNodeAction[];
	options: Option[];
	positionX?: number;
	positionY?: number;
	graph?: DialogueGraph;
	ID(): string;
	nameInitials(): string;
}

export interface DialogueNodeProps {
	id?: string;
	type?: string;
	name: string;
	description: string;
	actions?: Partial<IDialogueNodeAction>[];
	options?: Option[];
	positionX?: number;
	positionY?: number;
	graph?: Partial<IDialogueGraph>;
}

export class DialogueNode implements IDialogueNode {
	id: string;
	name: string;
	description: string;
	actions: IDialogueNodeAction[];
	options: Option[];
	positionX: number;
	positionY: number;
	graph?: DialogueGraph;

	constructor(props: Partial<DialogueNodeProps>) {
		this.id = props.id || crypto.randomUUID();
		this.name = props.name || '';
		this.description = props.description || '';
		this.positionX = props.positionX || 0;
		this.positionY = props.positionY || 0;
		this.actions = (props.actions || []).map((a) => new DialogueNodeAction(a));
		this.options = props.options || [];
		if (props.graph) {
			this.graph = new DialogueGraph(props.graph);
		}
	}

	ID(): string {
		return this.id;
	}

	nameInitials(): string {
		return this.name?.trim()?.[0]?.toUpperCase() || '';
	}
}

export interface IPosition {
	x: number;
	y: number;
}

// Re-export for compatibility
export type { IDialogueGraph as DialogueGraphProps };
