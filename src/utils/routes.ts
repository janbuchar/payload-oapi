import type { Config } from 'payload'

/** Plugins run before the config is sanitized, so `routes.api` may still be unset. */
export const apiRoute = ({ routes }: Pick<Config, 'routes'>): string => routes?.api ?? '/api'
