import { FieldName } from './fields';

export interface IPaginationParams {
	getLimit(): number;
	getPage(): number;
}

export class PaginationParams implements IPaginationParams {
	_limit: number;
	_page: number;

	constructor(limit: number, page: number) {
		this._limit = limit;
		this._page = page;
	}

	getLimit(): number {
		return this._limit;
	}

	getPage(): number {
		return this._page;
	}
}

/**
 * Operator
 */
export enum Op {
	Eq = 'eq',
	Neq = 'ne',
	GT = 'gt',
	GTEq = 'gte',
	LT = 'lt',
	LTEq = 'lte',
	In = 'in',
	Like = 'like',
	Between = 'btw',
	Contain = 'any',
	ContainsLike = 'any-like',
}

interface IField<T> {
	getValue(): T;
	getName(): string;
}

class Field<T> implements IField<T> {
	private _val: T;
	private _name: string;

	constructor(name: string, val: T) {
		this._val = val;
		this._name = name;
	}

	public getValue(): T {
		return this._val;
	}
	public getName(): string {
		return this._name;
	}
}

export interface IFieldFilter<T> {
	getField(): IField<T>;
	getOperator(): Op;
}

class FieldFilter<T> implements IFieldFilter<T> {
	private _field: IField<T>;
	private _operator: Op;

	constructor(operator: Op, name: FieldName, val: T) {
		this._field = new Field(name.toString(), val);
		this._operator = operator;
	}

	public getField(): IField<T> {
		return this._field;
	}

	public getOperator(): Op {
		return this._operator;
	}
}

export type Filters<T> = Map<string, IFieldFilter<T>>;

export interface IQuery {
	merge(q: IQuery): void;
	getFilters(): Filters<any>;
	getPagination(): IPaginationParams;
	getIncludes(): string[];
}

export type QueryOption = (q: Query) => void;

export class Query implements IQuery {
	private _filters: Filters<any>;
	private _pagination: PaginationParams;
	private _include: string[] = [];

	constructor(...opts: QueryOption[]) {
		this._filters = new Map<string, IFieldFilter<any>>();
		for (const opt of opts) {
			opt(this);
		}
	}

	public merge(q: IQuery): void {
		if (q) {
			this.mergeFilters(q.getFilters());
			if (q.getPagination()) {
				this._pagination = new PaginationParams(
					q.getPagination().getLimit(),
					q.getPagination().getPage(),
				);
			}
			if (q.getFilters()) {
				this._include = q.getIncludes();
			}
		}
	}

	public getFilters(): Filters<any> {
		return this._filters;
	}

	public getPagination(): IPaginationParams {
		return this._pagination;
	}

	public getIncludes(): string[] {
		return this._include;
	}

	static filterBy = (op: Op, fieldName: FieldName, val: any): QueryOption => {
		return (q: Query) => {
			q._filters.set(fieldName, new FieldFilter(op, fieldName, val));
		};
	};

	static pagination = (limit: number, page: number): QueryOption => {
		return (q: Query) => {
			q._pagination = new PaginationParams(limit, page);
		};
	};

	static include = (...relationshipNames: string[]): QueryOption => {
		return (q: Query) => {
			q._include = [...relationshipNames];
		};
	};

	private mergeFilters(filters: Filters<any>): void {
		filters.forEach((value: IFieldFilter<any>, key: string) => {
			this._filters.set(key, value);
		});
	}
}
