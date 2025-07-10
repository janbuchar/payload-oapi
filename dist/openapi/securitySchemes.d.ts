import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
export declare const apiKeySecurity: {
    ApiKey: never[];
};
export declare const generateSecuritySchemes: (tokenUrl: string) => Record<string, OpenAPIV3.SecuritySchemeObject & OpenAPIV3_1.SecuritySchemeObject>;
