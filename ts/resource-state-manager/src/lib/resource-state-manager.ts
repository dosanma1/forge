import { computed, signal, untracked, WritableSignal } from '@angular/core';
import {
	IResource,
	ListResponse,
	ModelType,
	Query,
	QueryOption,
} from 'ts-jsonapi';

type CallStatusState = {
	isLoading: boolean;
	error?: string;
};

type Pagination = {
	totalCount?: number;
	page?: number;
	limit?: number;
};

type State<R extends IResource> = {
	resources: R[];
	selectedResource?: R;
	pagination: Pagination;
	queryParams: QueryOption[];
} & CallStatusState;

export type ResourceStateManagerOption<R extends IResource> = (
	a: State<R>,
) => void;

const defaultResourceStateManagerOptions =
	(): ResourceStateManagerOption<any>[] => {
		return [];
	};

export class ResourceStateManager<R extends IResource> {
	private defaultState: State<R> = {
		resources: [],
		selectedResource: undefined,
		pagination: {
			totalCount: 0,
			page: 0,
			limit: 10,
		},
		queryParams: [Query.pagination(10, 0)],
		isLoading: false,
		error: undefined,
	};

	constructor(
		protected modelType: ModelType<R>,
		protected storage?: Storage,
		...opts: ResourceStateManagerOption<R>[]
	) {
		for (const opt of [...defaultResourceStateManagerOptions(), ...opts]) {
			opt(this.defaultState);
		}
	}

	private readonly state: WritableSignal<State<R>> = signal<State<R>>(
		this.defaultState,
	);

	readonly resources = computed(() => this.state().resources);
	readonly selectedResource = computed(() => this.state().selectedResource);
	readonly pagination = computed(() => this.state().pagination);
	readonly queryParams = computed(() => this.state().queryParams);
	readonly isLoading = computed(() => this.state().isLoading);
	readonly error = computed(() => this.state().error);

	setResources(
		res: R[],
		pagination: Pagination = untracked(() => this.pagination()),
	): void {
		this.state.update((state) => ({
			...state,
			resources: res,
			pagination: pagination,
		}));
	}

	addResources(...res: R[]): void {
		this.state.update((state) => ({
			...state,
			resources: [...state.resources, ...res],
			pagination: {
				...state.pagination,
				totalCount: state.pagination.totalCount + res.length,
			},
		}));
	}

	updateResource(res: R): void {
		this.state.update((state) => ({
			...state,
			resources: state.resources.map((r) =>
				r.ID() === res.ID() ? res : r,
			),
		}));
	}

	appendResourcesFromListResponse(res: ListResponse<R>, reverse = false) {
		if (res.result().length === 0) return;

		this.state.update((state) => ({
			...state,
			resources: [
				...this.concatResources(state.resources, res.result(), reverse),
			],
			total: res.meta().get('pagination').totalCount,
		}));
	}

	removeResource(res: R): void {
		this.state.update((state) => ({
			...state,
			resources: state.resources.filter((r) => r.ID() !== res.ID()),
			pagination: {
				...state.pagination,
				totalCount: state.pagination.totalCount - 1,
			},
		}));
	}

	removeResourceByID(id: string): void {
		this.state.update((state) => ({
			...state,
			resources: state.resources.filter((r) => r.ID() !== id),
			pagination: {
				...state.pagination,
				totalCount: state.pagination.totalCount - 1,
			},
		}));
	}

	getResourceById(id: string): R | undefined {
		return this.resources().find((r) => r.ID() === id);
	}

	setSelectedResourceById(id: string): void {
		this.state.update((state) => ({
			...state,
			selectedResource: state.resources.find((r) => r.ID() === id),
		}));

		if (this.storage) {
			this.storage.setItem('id', id);
		}
	}

	setSelectedResource(res: R): void {
		this.state.update((state) => ({
			...state,
			selectedResource: res,
		}));

		if (this.storage) {
			if (res) {
				this.storage.setItem('id', res.ID());
			} else {
				this.storage.removeItem('id');
			}
		}
	}

	setIsLoading(value: boolean): void {
		this.state.update((state) => ({
			...state,
			isLoading: value,
		}));
	}

	setError(error: string): void {
		this.state.update((state) => ({
			...state,
			error: error,
		}));
	}

	addQueryParams(...opts: QueryOption[]) {
		this.state.update((state) => ({
			...state,
			queryParams: [...state.queryParams, ...opts],
		}));
	}

	nextPage(page?: number): number {
		let nextPage: number = page;
		if (!page) {
			nextPage = this.pagination().page + 1;
		}

		this.state.update((state) => ({
			...state,
			pagination: {
				...state.pagination,
				page: nextPage,
			},
		}));

		return nextPage;
	}

	setPaginationLimit(limit: number): void {
		this.state.update((state) => ({
			...state,
			pagination: {
				...state.pagination,
				limit: limit,
			},
		}));
	}

	canLoadMore(): boolean {
		if (this.resources().length === 0) {
			return true;
		}

		return this.resources().length < this.pagination().totalCount;
	}

	resetState(): void {
		this.state.set(this.defaultState);
	}

	static withPaginationLimit = (
		limit: number,
	): ResourceStateManagerOption<any> => {
		return (s: State<any>): void => {
			s.pagination.limit = limit;
		};
	};

	private concatResources<R extends IResource>(
		currentRes: R[],
		newRes: R[],
		reverse = false,
	): R[] {
		if (reverse) {
			return [...newRes.reverse(), ...currentRes];
		}

		return [...currentRes, ...newRes];
	}
}
