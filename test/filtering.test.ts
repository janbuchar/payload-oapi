import { describe, it, expect } from 'vitest'
import type { Collection, SanitizedGlobalConfig } from 'payload'
import { filterCollections, filterGlobals } from '../src/utils/filtering.js'

describe('Filtering utilities', () => {
  const mockCollections = {
    posts: {
      config: { slug: 'posts', auth: false }
    } as unknown as Collection,
    users: {
      config: { slug: 'users', auth: true }
    } as unknown as Collection,
    media: {
      config: { slug: 'media', auth: false }
    } as unknown as Collection,
  }

  const mockGlobals = [
    { slug: 'settings' } as SanitizedGlobalConfig,
    { slug: 'internal-config' } as SanitizedGlobalConfig,
    { slug: 'public-info' } as SanitizedGlobalConfig,
  ]

  describe('filterCollections', () => {
    it('should return all collections when no filters are provided', () => {
      const result = filterCollections(mockCollections, {})
      expect(result).toHaveLength(3)
      expect(result.map(c => c.config.slug)).toEqual(['posts', 'users', 'media'])
    })

    it('should include only specified collections when includeCollections is an array', () => {
      const result = filterCollections(mockCollections, {
        includeCollections: ['posts', 'users']
      })
      expect(result).toHaveLength(2)
      expect(result.map(c => c.config.slug)).toEqual(['posts', 'users'])
    })

    it('should exclude specified collections when excludeCollections is an array', () => {
      const result = filterCollections(mockCollections, {
        excludeCollections: ['media']
      })
      expect(result).toHaveLength(2)
      expect(result.map(c => c.config.slug)).toEqual(['posts', 'users'])
    })

    it('should work with custom filter functions', () => {
      const result = filterCollections(mockCollections, {
        includeCollections: ({ config }) => config.auth === true
      })
      expect(result).toHaveLength(1)
      expect(result[0].config.slug).toBe('users')
    })

    it('should apply both include and exclude filters', () => {
      const result = filterCollections(mockCollections, {
        includeCollections: ['posts', 'users', 'media'],
        excludeCollections: ['media']
      })
      expect(result).toHaveLength(2)
      expect(result.map(c => c.config.slug)).toEqual(['posts', 'users'])
    })
  })

  describe('filterGlobals', () => {
    it('should return all globals when no filters are provided', () => {
      const result = filterGlobals(mockGlobals, {})
      expect(result).toHaveLength(3)
      expect(result.map(g => g.slug)).toEqual(['settings', 'internal-config', 'public-info'])
    })

    it('should include only specified globals when includeGlobals is an array', () => {
      const result = filterGlobals(mockGlobals, {
        includeGlobals: ['settings', 'public-info']
      })
      expect(result).toHaveLength(2)
      expect(result.map(g => g.slug)).toEqual(['settings', 'public-info'])
    })

    it('should exclude specified globals when excludeGlobals is an array', () => {
      const result = filterGlobals(mockGlobals, {
        excludeGlobals: ['internal-config']
      })
      expect(result).toHaveLength(2)
      expect(result.map(g => g.slug)).toEqual(['settings', 'public-info'])
    })

    it('should work with custom filter functions', () => {
      const result = filterGlobals(mockGlobals, {
        excludeGlobals: ({ slug }) => slug.startsWith('internal-')
      })
      expect(result).toHaveLength(2)
      expect(result.map(g => g.slug)).toEqual(['settings', 'public-info'])
    })

    it('should apply both include and exclude filters', () => {
      const result = filterGlobals(mockGlobals, {
        includeGlobals: ['settings', 'internal-config'],
        excludeGlobals: ['internal-config']
      })
      expect(result).toHaveLength(1)
      expect(result[0].slug).toBe('settings')
    })
  })
}) 