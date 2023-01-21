import type { Config } from 'payload/config'
import { PluginOptions } from './types'

export const openApi =
  (pluginOptions: PluginOptions) =>
  (config: Config): Config => {
    return {
      ...config,
      onInit: async payload => {},
    }
  }
