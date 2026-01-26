# Angular JSONAPI

A lightweight Angular adapter for [JSON API](http://jsonapi.org/)

## Introduction

If you’ve ever argued with your team about the way your JSON responses should be formatted, JSON:API can help you stop the bikeshedding and focus on what matters: your application.

By following shared conventions, you can increase productivity, take advantage of generalized tooling and best practices. Clients built around JSON:API are able to take advantage of its features around efficiently caching responses, sometimes eliminating network requests entirely.

Moreover, using Angular and Typescript, we like to interact with classes and models, not with bare JSONs. Thanks to this library, you will be able to map all your data into models and relationships.

Here’s an example response from a blog that implements JSON:API:

```json
{
  "links": {
    "self": "http://example.com/articles",
    "next": "http://example.com/articles?page[offset]=2",
    "last": "http://example.com/articles?page[offset]=10"
  },
  "data": [
    {
      "type": "articles",
      "id": "1",
      "attributes": {
        "title": "JSON:API paints my bikeshed!"
      },
      "relationships": {
        "author": {
          "links": {
            "self": "http://example.com/articles/1/relationships/author",
            "related": "http://example.com/articles/1/author"
          },
          "data": { "type": "people", "id": "9" }
        },
        "comments": {
          "links": {
            "self": "http://example.com/articles/1/relationships/comments",
            "related": "http://example.com/articles/1/comments"
          },
          "data": [
            { "type": "comments", "id": "5" },
            { "type": "comments", "id": "12" }
          ]
        }
      },
      "links": {
        "self": "http://example.com/articles/1"
      }
    }
  ],
  "included": [
    {
      "type": "people",
      "id": "9"
      // ...
    }
  ]
}
```

The response above contains the first in a collection of "articles", as well as links to subsequent members in that collection. It also contains resources linked to the article, including its author and comments. Last but not least, links are provided that can be used to fetch or update any of these resources.

JSON:API covers creating and updating resources as well, not just responses.

## Installation

To install this library, run:

```bash
npm install angular-jsonapi --save
```

### Angular CLI configuration

```json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true
  }
}
```

## Usage

### Configuration

First, you create a base service:

1. Extend from `GenericApiService`.
2. Decorate it with @JsonApiGenericApiConfig, set the `baseUrl`.
3. Pass the `HttpClient` decepency to the parent constructor.

Then set up your models:

1. Extend the Resource class.
2. Decorate it with @ResourceConfig, passing the type.
3. Decorate the class properties with @Attribute or @NestedAttribute.If a class property is decorated with @NestedAttribute, the child class must have the attributes mapped as @Wrapped.
4. Decorate the relationships attributes with @Relationship (child class must extend the Resource class).
5. Decorate the metadata with @Meta.

```typescript
import { Attribute, NestedAttribute, Relationship, Resource, ResourceConfig, Wrapped } from "angular-jsonapi";

@ResourceConfig({
  type: "articles",
})
export class Article extends Resource {
  @Attribute()
  summary: string;

  @NestedAttribute({ type: ArticleInfo })
  info: ArticleInfo;

  @Meta({ type: ArticlePrint })
  print: ArticlePrint;

  @Relationship({ type: Author })
  author: Author;

  @Relationship({ type: Publisher })
  publishers: Publisher[];
}

export class ArticleInfo extends WrappedResource {
  @Wrapped()
  title: any;
}

export class ArticlePrint extends WrappedResource {
  @Wrapped()
  numPages: number;
}

@ResourceConfig({
  type: "authors",
})
export class Author extends Resource {
  @Attribute()
  name: string;
}

@ResourceConfig({
  type: "publishers",
})
export class Publisher extends Resource {
  @Attribute()
  name: string;
}
```

### Working with attributes

To transform class properties to attributes, just decorate the property with `@Attribute`.

Options:

- serializedName: used to transform/map the field name.
- transformer: allows to serialize/deserialize data (must implement `Transformer` interface).

```typescript
import { ResourceConfig, Attribute, Resource } from "angular-jsonapi";

@ResourceConfig({
  type: "articles",
})
export class Article extends Resource {
  @Attribute({ serializedName: "summ" })
  summary: string;
}
```

### Working with nested attributes

When you are trying to transform objects that have nested objects, it's required to known what type of object you are trying to transform. Since Typescript does not have good reflection abilities yet, we should implicitly specify what type of object each property contain. This is done using `@NestedAttribute` decorator.

The nested class must extends from `WrappedResource` and all the fields must be decorated with `@Wrapped`

NestedAttribute Options:

- type(mandatory): same class as the field.
- serializedName: used to transform/map the field name.

Wrapped Options:

- type(mandatory): same class as the field.
- serializedName: used to transform/map the field name.
- transformer: allows to serialize/deserialize data (must implement `Transformer` interface).

```typescript
import { ResourceConfig, Attribute, NestedAttribute, Wrapped, Resource } from "angular-jsonapi";

@ResourceConfig({
  type: "articles",
})
export class Article extends Resource {
  @Attribute()
  summary: string;

  @NestedAttribute({ type: ArticleInfo })
  info: ArticleInfo;
}

export class ArticleInfo extends WrappedResource {
  @Wrapped()
  title: any;
}
```

### Meta

Sometimes we want to add metadata inside the attributes, to achieve that with can decorate the class property with `@Meta` and pass the type (same class as the field).

As the `@NestedAttribute`, the meta class must extends from `WrappedResource` and all the fields must be decorated with `@Wrapped`

Options:

- type(mandatory): same class as the field.
- serializedName: used to transform/map the field name.

```typescript
import { ResourceConfig, Attribute, Meta, Wrapped, Resource } from "angular-jsonapi";

@ResourceConfig({
  type: "articles",
})
export class Article extends Resource {
  @Attribute()
  summary: string;

  @Meta({ type: ArticlePrint })
  print: ArticlePrint;
}

export class ArticlePrint extends WrappedResource {
  @Wrapped()
  numPages: number;
}
```

### Relationships

To be able to add relationships, just add the `@Relationship` decorator to the class property along with the type (same class as the field).

In this case, the decorated class property must extend from `Resource`.

Options:

- type(mandatory): same class as the field.
- serializedName: used to transform/map the field name.

```typescript
import { ResourceConfig, Attribute, Relationship, Resource } from "angular-jsonapi";

@ResourceConfig({
  type: "articles",
})
export class Article extends Resource {
  @Attribute()
  summary: string;

  @Relationship({ type: Publisher })
  publishers: Publisher[];
}

@ResourceConfig({
  type: "publishers",
})
export class Publisher extends Resource {
  @Attribute()
  name: string;
}
```

## GenericApiService

### List

```typescript
service.list(Article).subscribe({
  next: (got: ListResponse<IArticle>) => {
    // DO SOMETHING
  },
});
```

### Get

```typescript
const articleId = "1";

service.get(Article, articleId).subscribe({
  next: (got: Article) => {
    // DO SOMETHING
  },
});
```

### Post

```typescript
const article = new Article();
article.summary = "...";

service.post(article).subscribe({
  next: (got: Article) => {
    // DO SOMETHING
  },
});
```

### Patch

```typescript
const article = new Article();
article.id = "1";
article.summary = "...";

service.patch(article).subscribe({
  next: (got: Article) => {
    // DO SOMETHING
  },
});
```

### Delete

```typescript
const article = new Article();
article.id = "1";

service.delete(article).subscribe({
  next: (got: Article) => {
    // DO SOMETHING
  },
});
```

### DeleteById

```typescript
const articleId = "1";

service.deleteById(Article, articleId).subscribe({
  next: (got: Article) => {
    // DO SOMETHING
  },
});
```

Every method has a set of options:

- withURL: to override the url.
- withHttpHeaders: do add extra headers to the request.
- withCredentials: property is a boolean value that indicates whether or not cross-site Access-Control requests should be made using credentials such as cookies, authentication headers or TLS client certificates. Setting withCredentials has no effect on same-origin requests. More info [here](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials).
- withSearchOpts: options to be able to filter or ask for resources to be included, for example:

  ```typescript
  const articleId =
  const opts = Search.withQueryOptions(Query.filterBy(Op.Eq, "title", "Title YXZ"));

  service.get(Article, articleID, GenericApiSvcConfig.withSearchOpts(opts)).subscribe({
      next: (got: Article) => {
          // DO SOMETHING
      },
  });
  ```

  will result in:

  ```
  http://example.com/articles/${articleID}?filter[title][eq]="Title YXZ"&page[limit]=30&page[offset]=0`
  ```

  Note: Pagination will be added by default if none is set.

- withRootMeta: adds additional meta to the root of the object, for example:

  ```typescript
  const rootMeta = {
    action: "CREATE",
  };

  const article = new Article();
  article.summary = "...";

  service.post(article, GenericApiSvcConfig.withRootMeta(rootMeta)).subscribe({
    next: (got: Article) => {
      // DO SOMETHING
    },
  });
  ```

  will result in:

  ```json
  {
    "meta": {
      "action": "CREATE"
    },
    "data": {}
    //...
  }
  ```

## Extend GenericApiService

Problably you are missing some methods in your usecases. A solution to this problem could be to add additional methods to your base service.

For example, we want to add a service method to be able to post form data, with the GenericApiService this is not posible, as it requires to pass a resource, but we can create a custom method that does this:

```typescript
import { Encoder, GenericApiConfig, GenericApiService, GenericApiSvcConfig, GenericApiSvcOption, HttpMethod, IResource, JsonApiGenericApiConfig, ModelType, newSingleDocResponseDecoder } from "angular-jsonapi";

export const BASE_URL = "http://localhost:8080";
export const API_VERSION = "v1";

const config: GenericApiConfig = {
  baseUrl: BASE_URL,
  apiVersion: API_VERSION,
};

@Injectable()
@JsonApiGenericApiConfig(config)
export class ApiService extends GenericApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  postFormData<R extends IResource>(resource: R, ...opts: GenericApiSvcOption[]): Observable<R> {
    const modelType = resource.constructor as ModelType<R>;

    const config = new GenericApiSvcConfig(...opts);
    const url = this.buildUrl(modelType, null, config.url);
    const httpHeaders = this.buildHttpHeaders(config.httpHeaders);

    const body = new Encoder().Encode(resource, Encoder.encodeWithRootMeta(config.rootMeta));

    const formData = new FormData();
    formData.set(
      "body",
      JSON.stringify(body, (_k, value) => {
        if (value instanceof Map) {
          return {
            dataType: "Map",
            value: Array.from(value.entries()),
          };
        } else {
          return value;
        }
      })
    );

    const req = new HttpRequest(HttpMethod.Post, url, formData, {
      headers: httpHeaders,
      withCredentials: config.withCredentials,
      responseType: "json",
    });
    req.serializeBody();

    return this.httpClient.request(req).pipe(
      filter((ev: HttpEvent<object>) => ev.type !== HttpEventType.Sent),
      map(newSingleDocResponseDecoder(modelType)),
      catchError(this.handleError())
    );
  }
}
```

## Development

### Build the library

The command `ng build angular-jsonapi` will create a bundle in the dist folder.

### Publish as Local Package

Go to `dist/angular-jsonapi/` folder and run the command `npm pack`.

This will create the package `angular-jsonai-1.0.0.tgz`.

Save the package inside a folder inside your project, for example in `/libs`.
Then you can install the package locally in your project with:

```bash
npm install ./libs/angular-jsonai-1.0.0.tgz
```
