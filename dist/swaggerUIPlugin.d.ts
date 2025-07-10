import type { Plugin } from 'payload';
declare const swaggerUI: ({ specEndpoint, docsUrl, enabled, }: {
    specEndpoint?: string;
    docsUrl?: string;
    enabled?: boolean;
}) => Plugin;
export default swaggerUI;
