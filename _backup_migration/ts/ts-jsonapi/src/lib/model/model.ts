import { IResource } from './resource';

export type ModelType<R extends IResource> = new (...args: any[]) => R;

export interface ClassConstructor<T = any> {
	new (...args: any[]): T;
}
