import { HttpParameterCodec, HttpParams } from '@angular/common/http';
import { CustomHttpParamEncoder } from '../http/http-params-encoder';
import {
	Filters,
	IFieldFilter,
	IPaginationParams,
	IQuery,
	PaginationParams,
	Query,
	QueryOption,
} from './query';

const DEFAULT_LIMIT = 30;
const DEFAULT_PAGE = 0;

export interface ISearch {
	getHttpParams: () => HttpParams;
}

export type SearchOption = (s: Search) => void;

const defaultSearchOption = (): SearchOption[] => {
	return [Search.withHttpParamsEncoder(new CustomHttpParamEncoder())];
};

export class Search implements ISearch {
	private _query: IQuery;
	private _httpParams: HttpParams;
	private _httpParamsEncoder: HttpParameterCodec;

	constructor(...opts: SearchOption[]) {
		this._query = new Query();

		for (const opt of [...defaultSearchOption(), ...opts]) {
			opt(this);
		}

		this._httpParams = new HttpParams({
			encoder: this._httpParamsEncoder,
		});
		this._httpParams = this.filterApply(
			this._httpParams,
			this._query.getFilters(),
		);
		this._httpParams = this.paginationApply(
			this._httpParams,
			this._query.getPagination(),
		);
		if (this._query.getIncludes() && this._query.getIncludes().length > 0) {
			this._httpParams = this.includeApply(
				this._httpParams,
				this._query.getIncludes(),
			);
		}
	}

	getHttpParams(): HttpParams {
		return this._httpParams;
	}

	static withHttpParamsEncoder = (
		encoder: HttpParameterCodec,
	): SearchOption => {
		return (s: Search): void => {
			s._httpParamsEncoder = encoder;
		};
	};

	static withQuery = (q: IQuery): SearchOption => {
		return (s: Search): void => {
			s._query.merge(q);
		};
	};

	static withQueryOptions = (...opts: QueryOption[]): SearchOption => {
		return (s: Search): void => {
			this.withQuery(new Query(...opts))(s);
		};
	};

	private filterApply = (
		httpParams: HttpParams,
		filters: Filters<any>,
	): HttpParams => {
		filters.forEach((filter: IFieldFilter<any>) => {
			httpParams = httpParams.set(
				`filter[${filter.getField().getName()}][${filter.getOperator()}]`,
				filter.getField().getValue(),
			);
		});
		return httpParams;
	};

	private paginationApply = (
		httpParams: HttpParams,
		pagination: IPaginationParams,
	): HttpParams => {
		if (!pagination) {
			pagination = new PaginationParams(DEFAULT_LIMIT, DEFAULT_PAGE);
		}

		let limit = pagination.getLimit();
		let page = pagination.getPage();

		if (!limit) limit = DEFAULT_LIMIT;
		if (!page) page = DEFAULT_PAGE;

		httpParams = httpParams.set('page[limit]', limit);
		httpParams = httpParams.set('page[offset]', limit * page);

		return httpParams;
	};

	private includeApply = (
		httpParams: HttpParams,
		relationshipNames: string[],
	): HttpParams => {
		return httpParams.set('include', relationshipNames.join(','));
	};
}
