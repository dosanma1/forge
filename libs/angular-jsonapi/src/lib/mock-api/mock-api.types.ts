import { HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export type MockApiReplyCallback =
  | ((data: {
      req: HttpRequest<any>;
      urlParams: { [key: string]: string };
    }) => [number, string | any] | Observable<any>)
  | undefined;

export type MockApiMethods =
  | 'get'
  | 'post'
  | 'patch'
  | 'delete'
  | 'put'
  | 'head'
  | 'jsonp'
  | 'options';
