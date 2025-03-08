export const mapValuesAsync = async <T, U>(
  mapper: (value: T) => Promise<U>,
  record: Record<string, T>,
): Promise<Record<string, U>> =>
  Object.fromEntries(
    await Promise.all(
      Object.entries(record).map(async ([key, value]) => [key, await mapper(value)]),
    ),
  )
