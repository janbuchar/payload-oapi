import type { Plugin } from 'payload';
declare const redoc: ({ specEndpoint, docsUrl, enabled, }: {
    specEndpoint?: string;
    docsUrl?: string;
    enabled?: boolean;
}) => Plugin;
export default redoc;
