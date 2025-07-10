import { camelize } from '../utils/strings.js';
export const collectionName = (collection) => {
    const labels = collection.config.labels;
    if (labels === undefined) {
        return { singular: collection.config.slug, plural: collection.config.slug };
    }
    const label = (value) => {
        if (typeof value === 'string') {
            return value;
        }
        if (typeof value === 'function') {
            return collection.config.slug; // TODO actually use the label function
        }
        return value['en'] ?? collection.config.slug;
    };
    return { singular: label(labels.singular), plural: label(labels.plural) };
};
export const globalName = (global) => {
    if (global.label === undefined) {
        return global.slug;
    }
    if (typeof global.label === 'string') {
        return global.label;
    }
    if (typeof global.label === 'function') {
        return global.slug; // TODO actually use the label function
    }
    return global.label['en'];
};
export const componentName = (type, name, { prefix, suffix } = {}) => {
    name = camelize(name);
    if (prefix) {
        name = prefix + name;
    }
    if (suffix) {
        name += suffix;
    }
    if (type === 'responses') {
        name += 'Response';
    }
    if (type === 'requestBodies') {
        name += 'RequestBody';
    }
    return name;
};
//# sourceMappingURL=naming.js.map