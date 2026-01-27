import { CustomHttpParamEncoder } from './http-params-encoder';

describe('utils/http-params-encoder', () => {
    it('should return http params', () => {
        const encoder = new CustomHttpParamEncoder();
        encoder.encodeKey('page[limit]');
        encoder.encodeValue('10');

        expect(encoder.decodeKey('page[limit]')).toEqual('page[limit]');
        expect(encoder.decodeValue('10')).toEqual('10');
    });
});
