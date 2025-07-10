import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import type { PayloadRequest } from 'payload';
import type { SanitizedPluginOptions } from '../types.js';
export declare const generateV30Spec: (req: Pick<PayloadRequest, "payload" | "protocol" | "headers">, options: SanitizedPluginOptions) => Promise<OpenAPIV3.Document>;
export declare const generateV31Spec: (req: Pick<PayloadRequest, "payload" | "protocol" | "headers">, options: SanitizedPluginOptions) => Promise<OpenAPIV3_1.Document>;
