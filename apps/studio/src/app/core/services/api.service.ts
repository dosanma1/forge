import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericApiService } from '@forge/angular-jsonapi';
import 'reflect-metadata';
import { GenericApiConfig, JsonApiGenericApiConfig } from '@forge/ts-jsonapi';
import { environment } from '../../../environments/environment';

const config: GenericApiConfig = {
	baseUrl: environment.url,
};

@Injectable({ providedIn: 'root' })
@JsonApiGenericApiConfig(config)
export class ApiService extends GenericApiService {
	constructor(http: HttpClient) {
		super(http);
	}
}
