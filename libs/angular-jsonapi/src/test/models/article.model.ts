import {
	Attribute,
	IResource,
	Meta,
	NestedAttribute,
	Relationship,
	Resource,
	ResourceConfig,
	ResourceProps,
	Wrapped,
	WrappedResource,
} from '@forge/ts-jsonapi';
import {
	DateTransformer,
	TimeFmt,
} from '../../lib/transformers/date.transformer';
import { Author, AuthorProps, IAuthor } from './author.model';
import { IPublisher, Publisher, PublisherProps } from './publisher.model';

type ArticleMedia = string;

export type ArticleInfoProps = {
	title: any;
};

export class ArticleInfo extends WrappedResource {
	@Wrapped()
	private title: any;

	constructor(props: Partial<ArticleInfoProps>) {
		super(props);
	}

	Title(): string {
		return this.title;
	}
}

export interface IArticleIllustrations {
	CreatedAt(): Date;
	Colours(): string[];
}

export type ArticleIllustrationsProps = {
	colours: string[];
	createdAt: Date;
};

export class ArticleIllustrations
	extends WrappedResource
	implements IArticleIllustrations
{
	@Wrapped()
	private colours: string[];

	@Wrapped({ transformer: DateTransformer.new(TimeFmt.dateOnly) })
	private createdAt: Date;

	constructor(props: Partial<ArticleIllustrationsProps>) {
		super(props);
	}

	CreatedAt(): Date {
		return this.createdAt;
	}

	Colours(): string[] {
		return this.colours;
	}
}

export type ArticlePrintProps = {
	numPages: number;
	caption: string;
	otherDescr: string;
	date: Date;
	tags: string[];
	constraints: Map<string, any>;
};

export class ArticlePrint extends WrappedResource {
	@Wrapped()
	numPages: number;

	@Wrapped()
	caption: string;

	@Wrapped({ serializedName: 'otherComments' })
	otherDescr: string;

	@Wrapped({ transformer: DateTransformer.new(TimeFmt.dateOnly) })
	date: Date;

	@Wrapped()
	tags: string[];

	@Wrapped()
	constraints: Map<string, any>;

	constructor(props: Partial<ArticlePrintProps>) {
		super(props);
	}
}

export interface IArticle extends IResource {
	Title(): string;
	PublishDate(): Date;
	Media(): ArticleMedia;
	MarketDate(): Date;
	MarketTime(): Date;
	Summary(): string;
	ReadAt(): Date;
	Tags(): string[];
	PrintTags(): string[];
	PrintConstraints(): Map<string, any>;
	TagsByKeyword(): Map<string, string[]>;
	NumPages(): number;
	PrintDate(): Date;
	Caption(): string;
	Author(): IAuthor;
	Coauthors(): IAuthor[];
	Publishers(): IPublisher[];
	OtherPublishers(): IPublisher[];
	Illustrations(): IArticleIllustrations[];
	Related(): IArticle[];
}

export type ArticleProps = Partial<ResourceProps> & {
	summary: string;
	media: ArticleMedia;
	publishDate: Date;
	marketDate: Date;
	marketTime: Date;
	readtAt: Date;
	tags: string[];
	tagsByKeyword: Map<string, string[]>;
	info: Partial<ArticleInfoProps>;
	illustrations: ArticleIllustrationsProps[];
	print: Partial<ArticlePrintProps>;
	author: Partial<AuthorProps>;
	coauthors: Partial<AuthorProps[]>;
	publishers: Partial<PublisherProps[]>;
	otherPublishers: Partial<PublisherProps[]>;
	relatedArticles: Partial<ArticleProps[]>;
};

export type ArticleOption = (a: Article) => void;

@ResourceConfig({
	type: 'articles',
})
export class Article extends Resource {
	@Attribute()
	private summary: string;

	@Attribute()
	private media: ArticleMedia;

	@Attribute()
	private publishDate: Date;

	@Attribute({ transformer: DateTransformer.new(TimeFmt.dateOnly) })
	private marketDate: Date;

	@Attribute({ transformer: DateTransformer.new(TimeFmt.timestamp) })
	private marketTime: Date;

	@Attribute({ transformer: DateTransformer.new(TimeFmt.timeOnly) })
	private readAt: Date;

	@Attribute()
	private tags: string[];

	@Attribute()
	private tagsByKeyword: Map<string, string[]>;

	@NestedAttribute({ type: ArticleInfo })
	private info: ArticleInfo;

	@NestedAttribute({ type: ArticleIllustrations })
	private illustrations: ArticleIllustrations[];

	@Meta({ type: ArticlePrint })
	private print: ArticlePrint;

	@Relationship({ type: Author })
	private author: Author;

	@Relationship({ type: Author })
	private coauthors: Author[];

	@Relationship({ type: Publisher })
	private publishers: Publisher[];

	@Relationship({ type: Publisher })
	private otherPublishers: Publisher[];

	@Relationship({ type: Article, serializedName: 'subarticles' })
	private relatedArticles: Article[];

	constructor(props: Partial<ArticleProps>, ...opts: ArticleOption[]) {
		super(props);

		if (props) {
			// Attributes
			this.summary = props.summary;
			this.media = props.media;
			this.publishDate = props.publishDate;
			this.marketDate = props.marketDate;
			this.marketTime = props.marketTime;
			this.readAt = props.readtAt;
			this.tags = props.tags;
			this.tagsByKeyword = props.tagsByKeyword;
			if (props.info) {
				this.info = new ArticleInfo(props.info);
			}
			if (props.illustrations) {
				this.illustrations = [];
				for (const i of props.illustrations) {
					this.illustrations = [
						...this.illustrations,
						new ArticleIllustrations(i),
					];
				}
			}
			if (props.print) {
				this.print = new ArticlePrint(props.print);
			}

			// Relationships
			if (props.author) {
				this.author = new Author(props.author);
			}
			if (props.coauthors) {
				this.coauthors = [];
				for (const coa of props.coauthors) {
					this.coauthors = [...this.coauthors, new Author(coa)];
				}
			}
			if (props.publishers) {
				this.publishers = [];
				for (const p of props.publishers) {
					this.publishers = [...this.publishers, new Publisher(p)];
				}
			}
			if (props.otherPublishers) {
				this.otherPublishers = [];
				for (const p of props.otherPublishers) {
					this.otherPublishers = [
						...this.otherPublishers,
						new Publisher(p),
					];
				}
			}
		}

		for (const opt of opts) {
			opt(this);
		}
	}

	static articleToProps(article: IArticle): ArticleProps {
		const articleProps: ArticleProps = Object.assign(
			Resource.toProps(article),
			{
				summary: article.Summary(),
				media: article.Media(),
				publishDate: article.PublishDate(),
				marketDate: article.MarketDate(),
				marketTime: article.MarketTime(),
				readtAt: article.ReadAt(),
				tags: article.Tags(),
				tagsByKeyword: article.TagsByKeyword(),
				info: {
					title: article.Title(),
				},
				illustrations: article.Illustrations().map((i) => {
					return {
						colours: i.Colours(),
						createdAt: i.CreatedAt(),
					};
				}),
				print: {
					caption: article.Caption(),
					constraints: article.PrintConstraints(),
					date: article.PrintDate(),
					numPages: article.NumPages(),
					tags: article.PrintTags(),
				},
				author: Object.assign(Resource.toProps(article.Author()), {
					name: article.Author().Name(),
				}),
				coauthors: [],
				publishers: [],
				otherPublishers: [],
				relatedArticles: [],
			},
		);

		if (article.Coauthors()) {
			for (const coa of article.Coauthors()) {
				const authorProps: AuthorProps = Object.assign(
					Resource.toProps(coa),
					{
						name: coa.Name(),
					},
				);
				articleProps.coauthors = [
					...articleProps.coauthors,
					authorProps,
				];
			}
		}
		if (article.Publishers()) {
			for (const p of article.Publishers()) {
				const publisherProps: PublisherProps = Object.assign(
					Resource.toProps(p),
					{
						name: p.Name(),
					},
				);
				articleProps.publishers = [
					...articleProps.publishers,
					publisherProps,
				];
			}
		}
		if (article.OtherPublishers()) {
			for (const p of article.OtherPublishers()) {
				const publisherProps: PublisherProps = Object.assign(
					Resource.toProps(p),
					{
						name: p.Name(),
					},
				);
				articleProps.otherPublishers = [
					...articleProps.otherPublishers,
					publisherProps,
				];
			}
		}
		if (article.Related()) {
			for (const rel of article.Related()) {
				const articleProps: ArticleProps = Article.articleToProps(rel);
				articleProps.relatedArticles = [
					...articleProps.relatedArticles,
					articleProps,
				];
			}
		}

		return articleProps;
	}

	static update(article: IArticle, ...opts: ArticleOption[]): Article {
		const articleProps: ArticleProps = this.articleToProps(article);
		const updateArticle = new Article(articleProps);

		for (const opt of opts) {
			opt(updateArticle);
		}

		return updateArticle;
	}

	static withSummary(summary: string): ArticleOption {
		return (a: Article) => {
			a.summary = summary;
		};
	}

	static withTitle(title: string): ArticleOption {
		return (a: Article) => {
			a.info = new ArticleInfo({ title: title });
		};
	}

	Title(): string {
		if (!this.info) {
			return null;
		}
		return this.info.Title();
	}

	PublishDate(): Date {
		return this.publishDate;
	}

	Media(): ArticleMedia {
		if (!this.media) {
			return 'unknown';
		}
		return this.media;
	}

	MarketDate(): Date {
		return this.marketDate;
	}

	MarketTime(): Date {
		return this.marketTime;
	}

	Summary(): string {
		return this.summary;
	}

	ReadAt(): Date {
		return this.readAt;
	}

	Tags(): string[] {
		return this.tags;
	}

	PrintTags(): string[] {
		if (!this.print) {
			return null;
		}
		return this.print.tags;
	}

	PrintConstraints(): Map<string, any> {
		if (!this.print) {
			return null;
		}
		return this.print.constraints;
	}

	TagsByKeyword(): Map<string, string[]> {
		return this.tagsByKeyword;
	}

	NumPages(): number {
		let numPages = 0;
		if (this.print) {
			numPages = this.print.numPages;
		}
		return numPages;
	}

	PrintDate(): Date {
		if (!this.print) {
			return null;
		}
		return this.print.date;
	}

	Caption(): string {
		if (!this.print) {
			return null;
		}
		return this.print.caption;
	}

	Author(): IAuthor {
		return this.author;
	}

	Coauthors(): IAuthor[] {
		return this.coauthors;
	}

	Publishers(): IPublisher[] {
		return this.publishers;
	}

	OtherPublishers(): IPublisher[] {
		return this.otherPublishers;
	}

	Illustrations(): IArticleIllustrations[] {
		if (!this.illustrations) return [];
		return this.illustrations;
	}

	Related(): IArticle[] {
		return this.relatedArticles;
	}
}
