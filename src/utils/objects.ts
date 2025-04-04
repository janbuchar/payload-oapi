export const mapValuesAsync = async <T, U>(
  mapper: (value: T) => Promise<U>,
  record: Record<string, T>,
): Promise<Record<string, U>> =>
  Object.fromEntries(
    await Promise.all(
      Object.entries(record).map(async ([key, value]) => [key, await mapper(value)]),
    ),
  )

export const visitObjectNodes = (
  subject: Record<string, unknown> | Array<unknown>,
  visitor: (
    subject: Record<string, unknown> & Array<unknown>,
    key: string | number,
    value: unknown,
  ) => void,
) => {
  if (Array.isArray(subject)) {
    for (const [index, value] of subject.entries()) {
      visitor(subject as any, index, value)
      visitObjectNodes(value as any, visitor)
    }
  } else if (typeof subject === 'object' && subject !== null && subject !== undefined) {
    for (const [key, value] of Object.entries(subject)) {
      visitor(subject as any, key, value)
      visitObjectNodes(value as any, visitor)
    }
  }
}
