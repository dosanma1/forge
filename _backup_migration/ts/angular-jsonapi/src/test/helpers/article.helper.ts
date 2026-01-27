import { assertEqualResource } from '../../../../ts-jsonapi/src/lib/model/test/helpers';
import { IArticle } from '../models/article.model';
import { assertEqualAuthor, assertEqualAuthors } from './author.helper';
import { assertEqualPublishers } from './publisher.helper';

export const assertEqualArticle = (want: IArticle, got: IArticle): void => {
	if (!want) {
		expect(got).not.toBeDefined();
		return;
	}

	assertEqualResource(want, got);
	expect(want.Title()).toBe(got.Title());
	expect(want.PublishDate()).toEqual(got.PublishDate());
	expect(want.MarketDate()).toEqual(got.MarketDate());
	expect(want.MarketTime()).toEqual(got.MarketTime());
	expect(want.Summary()).toBe(got.Summary());
	expect(want.ReadAt()).toEqual(got.ReadAt());
	expect(want.Media()).toBe(got.Media());
	expect(want.Tags()).toEqual(got.Tags());
	expect(want.TagsByKeyword()).toEqual(got.TagsByKeyword());
	expect(want.Illustrations().length).toBe(got.Illustrations().length);
	want.Illustrations().forEach((w, i) => expect(w).toEqual(got.Illustrations()[i]));
	expect(want.PrintConstraints()).toEqual(got.PrintConstraints());
	expect(want.PrintDate()).toBe(got.PrintDate());
	expect(want.PrintTags()).toEqual(got.PrintTags());
	assertEqualAuthor(want.Author(), got.Author());
	assertEqualAuthors(want.Coauthors(), got.Coauthors());
	assertEqualPublishers(want.Publishers(), got.Publishers());
	assertEqualPublishers(want.OtherPublishers(), got.OtherPublishers());
	assertEqualArticles(want.Related(), got.Related());
};

export const assertEqualArticles = (want: IArticle[], got: IArticle[]): void => {
	if (!want) {
		expect(got).not.toBeDefined();
		return;
	}
	expect(want.length).toBe(got.length);
	for (let i = 0; i <= want.length; i++) {
		assertEqualArticle(want[i], got[i]);
	}
};
