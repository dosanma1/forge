import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
import 'reflect-metadata';
import { catchError, filter, map, Observable, throwError } from 'rxjs';
import {
	Encoder,
	GenericApiConfig,
	getGenericApiConfigProperties,
	getResourceConfig,
	HEADER_ACCEPT,
	HEADER_CONTENT_TYPE,
	HttpMethod,
	IResource,
	ListResponse,
	MEDIA_TYPE,
	ModelType,
	newCollectionDocResponseDecoder,
	newSingleDocResponseDecoder,
	resDecoder,
	Search,
	SearchOption
} from 'ts-jsonapi';

export type GenericApiSvcOption = (a: GenericApiSvcConfig) => void;

const defaultGenericApiServiceConfigOptions = (): GenericApiSvcOption[] => {
	return [];
};

export class GenericApiSvcConfig {
	private _url: string;
	private _httpHeaders: HttpHeaders;
	private _withCredentials: boolean;
	private _searchOptions: SearchOption[] = [];
	private _rootMeta: any;

	constructor(...opts: GenericApiSvcOption[]) {
		for (const opt of [...defaultGenericApiServiceConfigOptions(), ...opts]) {
			opt(this);
		}
	}

	static withUrl = (url: string): GenericApiSvcOption => {
		return (c: GenericApiSvcConfig): void => {
			c._url = url;
		};
	};

	static withHttpHeaders = (httpHeaders: HttpHeaders): GenericApiSvcOption => {
		return (c: GenericApiSvcConfig): void => {
			c._httpHeaders = httpHeaders;
		};
	};

	static withCredentials = (withCredentials: boolean): GenericApiSvcOption => {
		return (c: GenericApiSvcConfig): void => {
			c._withCredentials = withCredentials;
		};
	};

	static withSearchOpts = (...opts: SearchOption[]): GenericApiSvcOption => {
		return (c: GenericApiSvcConfig): void => {
			c._searchOptions = opts;
		};
	};

	static withRootMeta = (rootMeta: any): GenericApiSvcOption => {
		return (c: GenericApiSvcConfig): void => {
			c._rootMeta = rootMeta;
		};
	};

	get url(): string {
		return this._url;
	}

	get httpHeaders(): HttpHeaders {
		return this._httpHeaders;
	}

	get withCredentials(): boolean {
		return this._withCredentials;
	}

	get searchOptions(): SearchOption[] {
		return this._searchOptions;
	}

	get rootMeta(): any {
		return this._rootMeta;
	}
}

export class GenericApiService {
	protected config: GenericApiConfig;

	constructor(protected httpClient: HttpClient) {
		this.config = getGenericApiConfigProperties(this.constructor);
	}

	list<R extends IResource>(modelType: ModelType<R>, ...opts: GenericApiSvcOption[]): Observable<ListResponse<R>> {
		return this.request(modelType, HttpMethod.Get, null, newCollectionDocResponseDecoder(modelType), ...opts);
	}

	get<R extends IResource>(modelType: ModelType<R>, id: string, ...opts: GenericApiSvcOption[]): Observable<R> {
		return this.request(modelType, HttpMethod.Get, id, newSingleDocResponseDecoder(modelType), ...opts);
	}

	post<R extends IResource>(resource: R, ...opts: GenericApiSvcOption[]): Observable<R> {
		return this.requestWithBody(HttpMethod.Post, resource, ...opts);
	}

	postFormData<R extends IResource>(resource: R, formData: FormData, ...opts: GenericApiSvcOption[]): Observable<R> {
		return this.requestWithFormDataBody(HttpMethod.Post, resource, formData, ...opts);
	}

	postBatch<R extends IResource>(resources: R[], ...opts: GenericApiSvcOption[]): Observable<ListResponse<R>> {
		return this.requestBatchWithBody(HttpMethod.Post, resources, newCollectionDocResponseDecoder, ...opts) as Observable<ListResponse<R>>;
	}

	patch<R extends IResource>(resource: R, ...opts: GenericApiSvcOption[]): Observable<R> {
		return this.requestWithBody(HttpMethod.Patch, resource, ...opts);
	}

	patchBatch<R extends IResource>(resources: R[], ...opts: GenericApiSvcOption[]): Observable<ListResponse<R>> {
		return this.requestBatchWithBody(HttpMethod.Patch, resources, newCollectionDocResponseDecoder, ...opts) as Observable<ListResponse<R>>;
	}

	delete<R extends IResource>(resource: R, ...opts: GenericApiSvcOption[]): Observable<R> {
		return this.requestWithBody(HttpMethod.Delete, resource, ...opts);
	}

	deleteBatch<R extends IResource>(resources: R[], ...opts: GenericApiSvcOption[]): Observable<R> {
		return this.requestBatchWithBody(HttpMethod.Delete, resources, newSingleDocResponseDecoder, ...opts) as Observable<R>;
	}

	deleteById<R extends IResource>(modelType: ModelType<R>, id: string, ...opts: GenericApiSvcOption[]): Observable<R> {
		return this.request(modelType, HttpMethod.Delete, id, newSingleDocResponseDecoder(modelType), ...opts);
	}

	protected buildUrl<R extends IResource>(modelType: ModelType<R>, id?: string, customUrl?: string): string {
		if (customUrl) {
			return customUrl;
		}

		const resourceConfig = getResourceConfig(modelType);

		const url: string = [this.config.baseUrl, this.config.apiVersion, resourceConfig.type, id].filter((x) => x).join('/');

		return url;
	}

	protected buildHttpHeaders(customHeaders?: HttpHeaders): HttpHeaders {
		let requestHeaders: HttpHeaders = new HttpHeaders({
			[HEADER_ACCEPT]: MEDIA_TYPE,
			[HEADER_CONTENT_TYPE]: MEDIA_TYPE
		});

		if (this.config.httpHeaders) {
			this.config.httpHeaders.keys().forEach((key) => {
				if (this.config.httpHeaders.has(key)) {
					requestHeaders = requestHeaders.set(key, this.config.httpHeaders.get(key));
				}
			});
		}

		if (customHeaders) {
			customHeaders.keys().forEach((key) => {
				if (customHeaders.has(key)) {
					requestHeaders = requestHeaders.set(key, customHeaders.get(key));
				}
			});
		}

		return requestHeaders;
	}

	protected handleError(): (error: HttpErrorResponse) => Observable<any> {
		return (error: HttpErrorResponse) => throwError(() => error);
	}

	private request<T, R extends IResource>(
		modelType: ModelType<R>,
		method: 'GET' | 'DELETE',
		id: string,
		decoder: resDecoder<object>,
		...opts: GenericApiSvcOption[]
	): Observable<T> {
		const config = new GenericApiSvcConfig(...opts);
		const url = this.buildUrl(modelType, id, config.url);
		const httpHeaders = this.buildHttpHeaders(config.httpHeaders);

		const params = method === 'GET' ? new Search(...config.searchOptions).getHttpParams() : null;

		const req = new HttpRequest(method, url, {
			params: params,
			headers: httpHeaders,
			withCredentials: config.withCredentials,
			responseType: 'json'
		});

		return this.httpClient.request(req).pipe(
			filter((ev: HttpEvent<object>) => ev.type !== HttpEventType.Sent),
			map(decoder),
			catchError(this.handleError())
		);
	}

	private requestWithBody<R extends IResource>(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', resource: R, ...opts: GenericApiSvcOption[]): Observable<R> {
		const modelType = resource.constructor as ModelType<R>;

		const config = new GenericApiSvcConfig(...opts);
		const url = this.buildUrl(modelType, this.getResourceID(method, resource), config.url);
		const httpHeaders = this.buildHttpHeaders(config.httpHeaders);

		const body = new Encoder().Encode(resource, Encoder.encodeAsClient(method), Encoder.encodeWithRootMeta(config.rootMeta));
		const req = new HttpRequest(method, url, body, {
			headers: httpHeaders,
			withCredentials: config.withCredentials,
			responseType: 'json'
		});

		return this.httpClient.request(req).pipe(
			filter((ev: HttpEvent<object>) => ev.type !== HttpEventType.Sent),
			map(newSingleDocResponseDecoder(modelType)),
			catchError(this.handleError())
		);
	}

	private requestBatchWithBody<R extends IResource>(
		method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
		resources: R[],
		decoder: Function,
		...opts: GenericApiSvcOption[]
	): Observable<R | ListResponse<R>> {
		const modelType = resources[0].constructor as ModelType<R>;

		const config = new GenericApiSvcConfig(...opts);
		const url = this.buildUrl(modelType, null, config.url);
		const httpHeaders = this.buildHttpHeaders(config.httpHeaders);

		const body = new Encoder().EncodeCollection(resources, Encoder.encodeAsClient(method), Encoder.encodeWithRootMeta(config.rootMeta));

		const req = new HttpRequest(method, url, body, {
			headers: httpHeaders,
			withCredentials: config.withCredentials,
			responseType: 'json'
		});

		return this.httpClient.request(req).pipe(
			filter((ev: HttpEvent<object>) => ev.type !== HttpEventType.Sent),
			map(decoder(modelType)),
			catchError(this.handleError())
		);
	}

	private requestWithFormDataBody<R extends IResource>(
		method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
		resource: R,
		formData: FormData,
		...opts: GenericApiSvcOption[]
	): Observable<R> {
		const modelType = resource.constructor as ModelType<R>;

		const config = new GenericApiSvcConfig(...opts);
		const url = this.buildUrl(modelType, this.getResourceID(method, resource), config.url);

		const req = new HttpRequest(method, url, formData, {
			withCredentials: config.withCredentials,
			responseType: 'json'
		});

		return this.httpClient.request(req).pipe(
			filter((ev: HttpEvent<object>) => ev.type !== HttpEventType.Sent),
			map(newSingleDocResponseDecoder(modelType)),
			catchError(this.handleError())
		);
	}

	private getResourceID<R extends IResource>(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', resource: R): string {
		if ((method === 'POST' || method === 'DELETE') && resource) return null;

		return resource.ID() ? resource.ID() : null;
	}
}
