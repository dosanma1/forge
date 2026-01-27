import { ModelType } from 'ts-jsonapi';
import { TestResource } from '../tests/test.model';
import { ResourceStateManager } from './resource-state-manager';

describe('ResourceStateManager', () => {
	let resourceStateManager: ResourceStateManager<TestResource>;
	let modelType: ModelType<TestResource>;

	const createResource = (id: string): TestResource => {
		return new TestResource({ id: id });
	};

	beforeEach(() => {
		modelType = {} as ModelType<TestResource>;
		resourceStateManager = new ResourceStateManager<TestResource>(
			modelType,
		);
	});

	it('should initialize with default state', () => {
		expect(resourceStateManager.resources()).toEqual([]);
		expect(resourceStateManager.selectedResource()).toBeUndefined();
		expect(resourceStateManager.isLoading()).toBe(false);
		expect(resourceStateManager.error()).toBeUndefined();
		expect(resourceStateManager.pagination()).toEqual({
			totalCount: 0,
			page: 0,
			limit: 10,
		});
	});

	it('should set resources and pagination', () => {
		const resources = [createResource('1'), createResource('2')];
		const pagination = { page: 1, limit: 10, totalCount: 2 };

		resourceStateManager.setResources(resources, pagination);

		expect(resourceStateManager.resources()).toEqual(resources);
		expect(resourceStateManager.pagination()).toEqual(pagination);
	});

	it('should add a resource and update totalCount', () => {
		const pagination = { page: 1, limit: 10, totalCount: 1 };
		const resource = createResource('1');
		resourceStateManager.setResources([resource], pagination);

		const newResource = createResource('2');
		resourceStateManager.addResources(newResource);

		expect(resourceStateManager.resources().length).toBe(2);
		expect(resourceStateManager.resources()).toContain(newResource);
		expect(resourceStateManager.pagination().totalCount).toBe(2);
	});

	it('should get resource by ID', () => {
		const resource = createResource('abc');
		resourceStateManager.setResources([resource], {
			page: 1,
			limit: 10,
			totalCount: 1,
		});

		expect(resourceStateManager.getResourceById('abc')).toBe(resource);
		expect(
			resourceStateManager.getResourceById('non-existent'),
		).toBeUndefined();
	});

	it('should set selected resource by ID', () => {
		const resource = createResource('x1');
		resourceStateManager.setResources([resource], {
			page: 1,
			limit: 10,
			totalCount: 1,
		});

		resourceStateManager.setSelectedResourceById('x1');
		expect(resourceStateManager.selectedResource()).toBe(resource);
	});

	it('should set selected resource directly', () => {
		const resource = createResource('x2');
		resourceStateManager.setSelectedResource(resource);
		expect(resourceStateManager.selectedResource()).toBe(resource);
	});

	it('should toggle loading state', () => {
		resourceStateManager.setIsLoading(true);
		expect(resourceStateManager.isLoading()).toBe(true);

		resourceStateManager.setIsLoading(false);
		expect(resourceStateManager.isLoading()).toBe(false);
	});

	it('should set error message', () => {
		resourceStateManager.setError('An error occurred');
		expect(resourceStateManager.error()).toBe('An error occurred');
	});

	it('should calculate next page correctly', () => {
		const pagination = { page: 2, limit: 10, totalCount: 20 };
		resourceStateManager.setResources([], pagination);

		const next = resourceStateManager.nextPage();
		expect(next).toBe(3);
		expect(resourceStateManager.pagination().page).toBe(3);
	});

	it('should go to specific page if provided', () => {
		const pagination = { page: 2, limit: 10, totalCount: 20 };
		resourceStateManager.setResources([], pagination);

		const next = resourceStateManager.nextPage(5);
		expect(next).toBe(5);
		expect(resourceStateManager.pagination().page).toBe(5);
	});

	it('should check if more data can be loaded', () => {
		const pagination = { page: 1, limit: 10, totalCount: 15 };
		const resources = [createResource('1'), createResource('2')];
		resourceStateManager.setResources(resources, pagination);

		expect(resourceStateManager.canLoadMore()).toBe(true);

		resourceStateManager.setResources(
			new Array(15).fill(0).map((_, i) => createResource(`${i}`)),
			{ ...pagination, totalCount: 15 },
		);
		expect(resourceStateManager.canLoadMore()).toBe(false);
	});

	it('should reset state to default', () => {
		const resource = createResource('reset');
		resourceStateManager.setResources([resource], {
			page: 1,
			limit: 1,
			totalCount: 1,
		});
		resourceStateManager.setSelectedResource(resource);
		resourceStateManager.setIsLoading(true);
		resourceStateManager.setError('error');

		resourceStateManager.resetState();

		expect(resourceStateManager.resources()).toEqual([]);
		expect(resourceStateManager.selectedResource()).toBeUndefined();
		expect(resourceStateManager.isLoading()).toBe(false);
		expect(resourceStateManager.error()).toBeUndefined();
		expect(resourceStateManager.pagination()).toEqual({
			totalCount: 0,
			page: 0,
			limit: 10,
		});
	});
});
