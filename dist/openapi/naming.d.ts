import type { Collection, SanitizedGlobalConfig } from 'payload';
export declare const collectionName: (collection: Collection) => {
    singular: string;
    plural: string;
};
export declare const globalName: (global: SanitizedGlobalConfig) => string;
export type ComponentType = 'schemas' | 'responses' | 'requestBodies';
export declare const componentName: (type: ComponentType, name: string, { prefix, suffix }?: {
    suffix?: string;
    prefix?: string;
}) => string;
