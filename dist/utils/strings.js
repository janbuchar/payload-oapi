export const upperFirst = (value) => value.length > 0 ? value[0].toUpperCase() + value.slice(1) : '';
export const camelize = (value) => value.split(/\s+/).map(upperFirst).join('');
//# sourceMappingURL=strings.js.map