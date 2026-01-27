import { HttpStatusCode, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Encoder, HEADER_ACCEPT, HEADER_CONTENT_TYPE, HttpMethod, ListResponse, MEDIA_TYPE, Resource, Timestamps } from '@forge/ts-jsonapi';
import { ApiService, BASE_URL } from '../../test/api.service';
import { getArticle } from '../../test/fixtures/article.fixture';
import { assertEqualArticle, assertEqualArticles } from '../../test/helpers/article.helper';
import { Article, IArticle } from '../../test/models/article.model';
import { GenericApiSvcConfig } from './generic-api.service';

describe('GenericApiService', () => {
	let service: ApiService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				ApiService,
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
				provideZonelessChangeDetection()
			]
		});

		service = TestBed.inject(ApiService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		// After every test, assert that there are no more pending requests.
		httpMock.verify();
	});

	it('list() should be called and return a list response with articles and meta pagination', (done: DoneFn) => {
		const expectedMethod = HttpMethod.Get;
		const expectedUrl = `${BASE_URL}/v1/articles?page[limit]=30&page[offset]=0`;
		const articles = [getArticle(), getArticle()];
		const res = new Encoder<IArticle>().EncodeCollection(articles, Encoder.encodeAsServer());

		service.list<IArticle>(Article).subscribe({
			next: (got: ListResponse<IArticle>) => {
				// TODO: assert meta
				assertEqualArticles(articles, got.result());
			},
			complete: () => done()
		});

		const mockReq = httpMock.expectOne({
			method: expectedMethod,
			url: expectedUrl
		});
		expect(mockReq.cancelled).toBeFalsy();
		expect(mockReq.request.responseType).toEqual('json');
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBe(MEDIA_TYPE);
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBe(MEDIA_TYPE);
		mockReq.flush(res, { status: HttpStatusCode.Ok, statusText: 'OK' });
	});

	it('get() should be called and return an article', (done: DoneFn) => {
		const articleID = '1234';
		const expectedMethod = HttpMethod.Get;
		const expectedUrl = `${BASE_URL}/v1/articles/${articleID}?page[limit]=30&page[offset]=0`;
		const article = getArticle();
		const res = new Encoder<IArticle>().Encode(article, Encoder.encodeAsServer());

		service.get<IArticle>(Article, articleID).subscribe({
			next: (got: IArticle) => {
				assertEqualArticle(article, got);
			},
			complete: () => done()
		});

		const mockReq = httpMock.expectOne({
			method: expectedMethod,
			url: expectedUrl
		});
		expect(mockReq.cancelled).toBeFalsy();
		expect(mockReq.request.responseType).toEqual('json');
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBe(MEDIA_TYPE);
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBe(MEDIA_TYPE);
		mockReq.flush(res, { status: HttpStatusCode.Ok, statusText: 'OK' });
	});

	it('create() should be called and return the article created with id', (done: DoneFn) => {
		const articleID = '1234';
		const expectedMethod = 'POST';
		const expectedUrl = `${BASE_URL}/v1/articles`;
		const article = new Article({
			summary: 'summary 2'
		});
		const now = new Date();
		const expectedResult = Article.update(
			getArticle(),
			Resource.withID(articleID),
			Resource.withType('articles'),
			Resource.withTimestamps(Timestamps.withCreatedAt(now), Timestamps.withUpdatedAt(now)),
			Article.withSummary(article.Summary())
		);
		const req = new Encoder().Encode(article);
		const res = new Encoder().Encode(expectedResult, Encoder.encodeAsServer());

		service.post<IArticle>(article).subscribe({
			next: (got: IArticle) => {
				assertEqualArticle(expectedResult, got);
			},
			complete: () => done()
		});

		const mockReq = httpMock.expectOne({
			method: expectedMethod,
			url: expectedUrl
		});
		expect(mockReq.cancelled).toBeFalsy();
		expect(mockReq.request.responseType).toEqual('json');
		expect(mockReq.request.body).toEqual(req);
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBe(MEDIA_TYPE);
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBe(MEDIA_TYPE);
		mockReq.flush(res, { status: HttpStatusCode.Ok, statusText: 'OK' });
	});

	it('create() should be called with batch data and return the articles created with id', (done: DoneFn) => {
		const article1ID = '1234';
		const article2ID = '5678';
		const expectedMethod = 'POST';
		const expectedUrl = `${BASE_URL}/v1/articles`;
		const article1 = new Article({
			summary: 'summary 1'
		});
		const article2 = new Article({
			summary: 'summary 2'
		});
		const now = new Date();
		const expectedResult = [
			Article.update(
				getArticle(),
				Resource.withID(article1ID),
				Resource.withType('articles'),
				Resource.withTimestamps(Timestamps.withCreatedAt(now), Timestamps.withUpdatedAt(now)),
				Article.withSummary(article1.Summary())
			),
			Article.update(
				getArticle(),
				Resource.withID(article2ID),
				Resource.withType('articles'),
				Resource.withTimestamps(Timestamps.withCreatedAt(now), Timestamps.withUpdatedAt(now)),
				Article.withSummary(article2.Summary())
			)
		];
		const req = new Encoder().EncodeCollection([article1, article2], Encoder.encodeAsClient(HttpMethod.Post), Encoder.encodeWithRootMeta(undefined));
		const res = new Encoder<IArticle>().EncodeCollection(expectedResult, Encoder.encodeAsServer());

		service.postBatch<IArticle>([article1, article2]).subscribe({
			next: (got: ListResponse<IArticle>) => {
				assertEqualArticles(expectedResult, got.result());
			},
			complete: () => done()
		});

		const mockReq = httpMock.expectOne({
			method: expectedMethod,
			url: expectedUrl
		});
		expect(mockReq.cancelled).toBeFalsy();
		expect(mockReq.request.responseType).toEqual('json');
		expect(mockReq.request.body).toEqual(req);
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBe(MEDIA_TYPE);
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBe(MEDIA_TYPE);
		mockReq.flush(res, { status: HttpStatusCode.Ok, statusText: 'OK' });
	});

	it('update() should be called and return the full article updated', (done: DoneFn) => {
		const articleID = '1234';
		const expectedMethod = HttpMethod.Patch;
		const expectedUrl = `${BASE_URL}/v1/articles/${articleID}`;
		const article = new Article({
			id: articleID,
			info: {
				title: 'title 2'
			}
		});
		const now = new Date();
		const expectedResult = Article.update(
			getArticle(),
			Resource.withResource(article),
			Resource.withTimestamps(Timestamps.withUpdatedAt(now)),
			Article.withTitle(article.Title())
		);
		const req = new Encoder().Encode(article, Encoder.encodeAsClient(HttpMethod.Patch));
		const res = new Encoder().Encode(expectedResult, Encoder.encodeAsServer());

		service.patch<IArticle>(article).subscribe({
			next: (got: IArticle) => {
				assertEqualArticle(expectedResult, got);
			},
			complete: () => done()
		});

		const mockReq = httpMock.expectOne({
			method: expectedMethod,
			url: expectedUrl
		});
		expect(mockReq.cancelled).toBeFalsy();
		expect(mockReq.request.responseType).toEqual('json');
		expect(mockReq.request.body).toEqual(req);
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBe(MEDIA_TYPE);
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBe(MEDIA_TYPE);
		mockReq.flush(res, { status: HttpStatusCode.Ok, statusText: 'OK' });
	});

	it('update() should be called with batch data and return the full articles updated', (done: DoneFn) => {
		const article1ID = '1234';
		const article2ID = '5678';
		const expectedMethod = HttpMethod.Patch;
		const expectedUrl = `${BASE_URL}/v1/articles`;
		const article1 = new Article({
			id: article1ID,
			info: {
				title: 'title 1'
			}
		});
		const article2 = new Article({
			id: article2ID,
			info: {
				title: 'title 2'
			}
		});
		const now = new Date();
		const expectedResult = [
			Article.update(getArticle(), Resource.withResource(article1), Resource.withTimestamps(Timestamps.withUpdatedAt(now)), Article.withTitle(article1.Title())),
			Article.update(getArticle(), Resource.withResource(article2), Resource.withTimestamps(Timestamps.withUpdatedAt(now)), Article.withTitle(article2.Title()))
		];
		const req = new Encoder().EncodeCollection([article1, article2], Encoder.encodeAsClient(HttpMethod.Patch), Encoder.encodeWithRootMeta(undefined));
		const res = new Encoder<IArticle>().EncodeCollection(expectedResult, Encoder.encodeAsServer());

		service.patchBatch<IArticle>([article1, article2]).subscribe({
			next: (got: ListResponse<IArticle>) => {
				assertEqualArticles(expectedResult, got.result());
			},
			complete: () => done()
		});

		const mockReq = httpMock.expectOne({
			method: expectedMethod,
			url: expectedUrl
		});
		expect(mockReq.cancelled).toBeFalsy();
		expect(mockReq.request.responseType).toEqual('json');
		expect(mockReq.request.body).toEqual(req);
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBe(MEDIA_TYPE);
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBe(MEDIA_TYPE);
		mockReq.flush(res, { status: HttpStatusCode.Ok, statusText: 'OK' });
	});

	it('deleteById() should be called and return no content', (done: DoneFn) => {
		const articleID = '1234';
		const expectedMethod = HttpMethod.Delete;
		const expectedUrl = `${BASE_URL}/v1/articles/${articleID}`;

		service.deleteById<IArticle>(Article, articleID).subscribe({
			next: (got: IArticle) => {
				expect(got).toBeNull;
			},
			complete: () => done()
		});

		const mockReq = httpMock.expectOne({
			method: expectedMethod,
			url: expectedUrl
		});
		expect(mockReq.cancelled).toBeFalsy();
		expect(mockReq.request.responseType).toEqual('json');
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBe(MEDIA_TYPE);
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBe(MEDIA_TYPE);
		mockReq.flush({}, { status: HttpStatusCode.NoContent, statusText: 'No Content' });
	});

	it('delete() should be called and return no content', (done: DoneFn) => {
		const expectedMethod = HttpMethod.Delete;
		const expectedUrl = `${BASE_URL}/v1/articles`;
		const article = getArticle();
		const req = new Encoder().Encode(article, Encoder.encodeAsClient(HttpMethod.Delete));

		service.delete<IArticle>(article).subscribe({
			next: (got: IArticle) => {
				expect(got).toBeNull();
			},
			complete: () => done()
		});

		const mockReq = httpMock.expectOne({
			method: expectedMethod,
			url: expectedUrl
		});
		expect(mockReq.cancelled).toBeFalsy();
		expect(mockReq.request.responseType).toEqual('json');
		expect(mockReq.request.body).toEqual(req);
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBe(MEDIA_TYPE);
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBe(MEDIA_TYPE);
		mockReq.flush({}, { status: HttpStatusCode.NoContent, statusText: 'No Content' });
	});

	it('delete() should be called with batch data and return no content', (done: DoneFn) => {
		const expectedMethod = HttpMethod.Delete;
		const expectedUrl = `${BASE_URL}/v1/articles`;
		const article1 = getArticle();
		const article2 = getArticle();
		const req = new Encoder().EncodeCollection([article1, article2], Encoder.encodeAsClient(HttpMethod.Patch), Encoder.encodeWithRootMeta(undefined));

		service.deleteBatch<IArticle>([article1, article2]).subscribe({
			next: (got: IArticle) => {
				expect(got).toBeNull();
			},
			complete: () => done()
		});

		const mockReq = httpMock.expectOne({
			method: expectedMethod,
			url: expectedUrl
		});
		expect(mockReq.cancelled).toBeFalsy();
		expect(mockReq.request.responseType).toEqual('json');
		expect(mockReq.request.body).toEqual(req);
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBe(MEDIA_TYPE);
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBe(MEDIA_TYPE);
		mockReq.flush({}, { status: HttpStatusCode.NoContent, statusText: 'No Content' });
	});

	it('create() should be called with root meta and return the article created with the id', (done: DoneFn) => {
		const articleID = '1234';
		const expectedMethod = 'POST';
		const expectedUrl = `${BASE_URL}/v1/articles`;
		const rootMeta = {
			test: 1
		};
		const article = new Article({
			summary: 'summary 2'
		});
		const now = new Date();
		const expectedResult = Article.update(
			getArticle(),
			Resource.withID(articleID),
			Resource.withType('articles'),
			Resource.withTimestamps(Timestamps.withCreatedAt(now), Timestamps.withUpdatedAt(now)),
			Article.withSummary(article.Summary())
		);
		const req = new Encoder().Encode(article, Encoder.encodeWithRootMeta(rootMeta));
		const res = new Encoder().Encode(expectedResult, Encoder.encodeWithRootMeta(rootMeta), Encoder.encodeAsServer());

		service.post<IArticle>(article, GenericApiSvcConfig.withRootMeta(rootMeta)).subscribe({
			next: (got: IArticle) => {
				assertEqualArticle(expectedResult, got);
			},
			complete: () => done()
		});

		const mockReq = httpMock.expectOne({
			method: expectedMethod,
			url: expectedUrl
		});
		expect(mockReq.cancelled).toBeFalsy();
		expect(mockReq.request.responseType).toEqual('json');
		expect(mockReq.request.body).toEqual(req);
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBe(MEDIA_TYPE);
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBe(MEDIA_TYPE);
		mockReq.flush(res, { status: HttpStatusCode.Ok, statusText: 'OK' });
	});

	it('create() should be called with form data and return no content ', (done: DoneFn) => {
		const expectedMethod = 'POST';
		const expectedUrl = `${BASE_URL}/v1/articles`;
		const article = new Article({
			summary: 'summary 2'
		});

		const req = new Encoder().Encode(article);

		const formData = new FormData();
		formData.set(
			'body',
			JSON.stringify(req, (_k, value) => {
				if (value instanceof Map) {
					return {
						dataType: 'Map',
						value: Array.from(value.entries())
					};
				} else {
					return value;
				}
			})
		);

		service.postFormData<IArticle>(article, formData).subscribe({
			next: (got: IArticle) => {
				expect(got).toBeNull();
			},
			complete: () => done()
		});

		const mockReq = httpMock.expectOne({
			method: expectedMethod,
			url: expectedUrl
		});
		expect(mockReq.cancelled).toBeFalsy();
		expect(mockReq.request.responseType).toEqual('json');
		expect(mockReq.request.body).toEqual(formData);
		expect((mockReq.request.body as FormData).get('body')).toEqual(formData.get('body'));
		mockReq.flush({}, { status: HttpStatusCode.NoContent, statusText: 'No Content' });
	});

	it('get() should be called and return an error when the server returns a 404 error', (done: DoneFn) => {
		const articleID = '1234';
		const expectedMethod = HttpMethod.Get;
		const expectedUrl = `${BASE_URL}/v1/articles/${articleID}?page[limit]=30&page[offset]=0`;
		const error = {
			jsonapi: {
				version: '1.1'
			},
			errors: [
				{
					id: 'fa211a935a5b893744c2fa6936689c72',
					status: '404',
					detail: 'error in resource type article: not found given: id: 1'
				}
			]
		};

		service.get<IArticle>(Article, articleID).subscribe({
			next: (got: IArticle) => expect(got).toBeNull(),
			error: (err) => {
				expect(err).toBeDefined();
				done();
			},
			complete: () => done()
		});

		const mockReq = httpMock.expectOne({
			method: expectedMethod,
			url: expectedUrl
		});
		expect(mockReq.cancelled).toBeFalsy();
		expect(mockReq.request.responseType).toEqual('json');
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_ACCEPT)).toBe(MEDIA_TYPE);
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBeDefined();
		expect(mockReq.request.headers.get(HEADER_CONTENT_TYPE)).toBe(MEDIA_TYPE);
		mockReq.flush(error, {
			status: HttpStatusCode.NotFound,
			statusText: 'Not Found'
		});
	});
});
