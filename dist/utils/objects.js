export const mapValuesAsync = async (mapper, record) => Object.fromEntries(await Promise.all(Object.entries(record).map(async ([key, value]) => [key, await mapper(value)])));
export const visitObjectNodes = (subject, visitor) => {
    if (Array.isArray(subject)) {
        for (const [index, value] of subject.entries()) {
            visitor(subject, index, value);
            visitObjectNodes(value, visitor);
        }
    }
    else if (typeof subject === 'object' && subject !== null && subject !== undefined) {
        for (const [key, value] of Object.entries(subject)) {
            visitor(subject, key, value);
            visitObjectNodes(value, visitor);
        }
    }
};
//# sourceMappingURL=objects.js.map