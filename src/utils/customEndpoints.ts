import type { CustomEndpointDocumentation, OpenAPIVersion } from '../types.js'

export const createCustomEndpointDocumentation = <TVersion extends OpenAPIVersion = '3.0'>(
  documentation: CustomEndpointDocumentation<TVersion>,
) => {
  return documentation
}
