export const upperFirst = (value: string) => value[0].toUpperCase() + value.slice(1)
export const camelize = (value: string) => value.split(/\s+/).map(upperFirst).join('')
