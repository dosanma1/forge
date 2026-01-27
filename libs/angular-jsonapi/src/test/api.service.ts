import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericApiConfig, JsonApiGenericApiConfig } from '@forge/ts-jsonapi';
import { GenericApiService } from '../public-api';

export const BASE_URL = 'http://localhost:8080';
export const API_VERSION = 'v1';

const config: GenericApiConfig = {
	baseUrl: BASE_URL,
	apiVersion: API_VERSION
};

@Injectable()
@JsonApiGenericApiConfig(config)
export class ApiService extends GenericApiService {
	constructor(http: HttpClient) {
		super(http);
	}
}
