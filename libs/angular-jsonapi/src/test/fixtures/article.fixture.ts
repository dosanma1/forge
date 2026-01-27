import { Article } from '../models/article.model';

export function getArticle(): Article {
    const readAt = new Date();
    readAt.setHours(3, 31, 1, 0);

    return new Article({
        id: '1234',
        type: 'articles',
        timestamps: {
            createdAt: new Date('2023-01-01T01:01:01.123Z'),
            updatedAt: new Date('2023-01-03T01:01:01.123Z'),
            deletedAt: new Date('2023-01-02T01:01:01.123Z'),
        },
        info: {
            title: 'title 1',
        },
        publishDate: new Date('2023-01-01'),
        marketDate: new Date('2024-01-01'),
        summary: 'summary',
        media: 'website',
        readtAt: readAt,
        tags: ['tag 1', 'tag 2'],
        tagsByKeyword: new Map<string, string[]>([
            ['keyword 1', ['tag 1']],
            ['keyword 2', ['tag 2']],
        ]),
        illustrations: [
            {
                colours: ['#ffffff', '#000000'],
                createdAt: new Date('2023-01-01'),
            },
        ],
        print: {
            caption: 'caption 1',
            constraints: new Map<string, any>([
                ['paperWeight', 2.1],
                ['paperWeightUnits', 'g'],
            ]),
            date: new Date('2023-01-01'),
            tags: ['A4', 'white', 'double-sided'],
        },
        author: {
            id: 'author id 1',
            name: 'author name 1',
            type: 'authors',
            timestamps: {
                createdAt: new Date('2023-01-01T01:01:01.123Z'),
                updatedAt: new Date('2023-01-03T01:01:01.123Z'),
            },
        },
        coauthors: [
            {
                id: 'coauthor id 1',
                type: 'authors',
                name: 'coauthor name 1',
                timestamps: {
                    createdAt: new Date('2023-01-01T01:01:01.123Z'),
                    updatedAt: new Date('2023-01-03T01:01:01.123Z'),
                },
            },
        ],
        publishers: [
            {
                id: 'publisher id 1',
                type: 'publishers',
                name: 'publisher name 1',
                timestamps: {
                    createdAt: new Date('2023-01-01T01:01:01.123Z'),
                    updatedAt: new Date('2023-01-03T01:01:01.123Z'),
                },
            },
            {
                id: 'publisher id 10000',
                type: 'publishers',
                name: 'publisher name 10000',
                timestamps: {
                    createdAt: new Date('2023-01-01T01:01:01.123Z'),
                    updatedAt: new Date('2023-01-03T01:01:01.123Z'),
                },
            },
        ],
    });
}
