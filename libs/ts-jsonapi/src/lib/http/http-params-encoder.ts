import { HttpParameterCodec } from '@angular/common/http';

export class CustomHttpParamEncoder implements HttpParameterCodec {
    encodeKey(key: string): string {
        return key;
    }
    encodeValue(value: string): string {
        return value;
    }
    decodeKey(key: string): string {
        return key;
    }
    decodeValue(value: string): string {
        return value;
    }
}
