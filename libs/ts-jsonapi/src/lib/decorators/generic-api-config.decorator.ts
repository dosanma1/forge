import { HttpHeaders } from '@angular/common/http';

const GENERIC_API_CONFIG_METADATA_KEY: string = 'generic-api-config:metadata';

export function getGenericApiConfigProperties(target: any): any {
	return Reflect.getMetadata(GENERIC_API_CONFIG_METADATA_KEY, target) || [];
}

export interface GenericApiConfig {
	baseUrl?: string;
	apiVersion?: string;
	httpHeaders?: HttpHeaders;
}

export function JsonApiGenericApiConfig(config: GenericApiConfig = {}): ClassDecorator {
	return (target: any) => {
		Reflect.defineMetadata(GENERIC_API_CONFIG_METADATA_KEY, config, target);
	};
}
