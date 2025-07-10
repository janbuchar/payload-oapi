export declare const mapValuesAsync: <T, U>(mapper: (value: T) => Promise<U>, record: Record<string, T>) => Promise<Record<string, U>>;
export declare const visitObjectNodes: (subject: Record<string, unknown> | Array<unknown>, visitor: (subject: Record<string, unknown> & Array<unknown>, key: string | number, value: unknown) => void) => void;
