import type { PayloadRequest } from 'payload';
import type { SanitizedPluginOptions } from './types.js';
export declare const createOpenAPIRequestHandler: (options: SanitizedPluginOptions) => (req: PayloadRequest) => Promise<Response>;
export declare const createOAuthPasswordFlowHandler: () => (req: PayloadRequest) => Promise<Response>;
