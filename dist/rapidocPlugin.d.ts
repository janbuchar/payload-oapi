import type { Plugin } from 'payload';
declare const rapidoc: ({ specEndpoint, docsUrl, enabled, }: {
    specEndpoint?: string;
    docsUrl?: string;
    enabled?: boolean;
}) => Plugin;
export default rapidoc;
