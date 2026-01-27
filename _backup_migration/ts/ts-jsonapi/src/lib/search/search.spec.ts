import { FieldName, merge } from './fields';
import { Op, Query } from './query';
import { Search } from './search';

const fieldNameId: FieldName = 'id';
const fieldNameTest: FieldName = 'test';

describe('jsonapi/search', () => {
    it('given a 0 pagination limit, should return the default pagination limit', () => {
        const opts = Search.withQueryOptions(Query.filterBy(Op.Eq, merge(fieldNameTest, fieldNameId), 'test'), Query.pagination(0, 0));
        const s = new Search(opts);

        expect(s.getHttpParams().toString()).toEqual('filter[test.id][eq]=test&page[limit]=30&page[offset]=0');
    });

    it('given a filter and not pagination, should return filter and default pagination', () => {
        const opts = Search.withQueryOptions(Query.filterBy(Op.Eq, merge(fieldNameTest, fieldNameId), 'test'));
        const s = new Search(opts);

        expect(s.getHttpParams().toString()).toEqual('filter[test.id][eq]=test&page[limit]=30&page[offset]=0');
    });

    it('given a filter and not pagination, should return filter and pagination', () => {
        const opts = Search.withQueryOptions(Query.filterBy(Op.Eq, merge(fieldNameTest, fieldNameId), 'test'), Query.pagination(5, 1));
        const s = new Search(opts);

        expect(s.getHttpParams().toString()).toEqual('filter[test.id][eq]=test&page[limit]=5&page[offset]=5');
    });
    it('given a filter and include, should return filter, pagination and include', () => {
        const opts = Search.withQueryOptions(
            Query.filterBy(Op.Eq, merge(fieldNameTest, fieldNameId), 'test'),
            Query.include('testInclude1', 'testInclude2'),
            Query.pagination(5, 1)
        );
        const s = new Search(opts);

        expect(s.getHttpParams().toString()).toEqual('filter[test.id][eq]=test&page[limit]=5&page[offset]=5&include=testInclude1,testInclude2');
    });
});
