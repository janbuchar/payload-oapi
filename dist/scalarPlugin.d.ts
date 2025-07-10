import type { Plugin } from 'payload';
declare const scalar: ({ specEndpoint, docsUrl, enabled, }: {
    specEndpoint?: string;
    docsUrl?: string;
    enabled?: boolean;
}) => Plugin;
export default scalar;
