import type { Collection, Field, SanitizedGlobalConfig } from 'payload'
import { describe, expect, it } from 'vitest'
import type { CRUDOperation } from '../src/types.js'
import {
  filterCollections,
  filterFields,
  filterGlobals,
  shouldIncludeOperation,
} from '../src/utils/filtering.js'

describe('Advanced Filtering utilities', () => {
  const mockCollections = {
    posts: {
      config: { slug: 'posts', auth: false, access: { read: true } },
    } as unknown as Collection,
    users: {
      config: { slug: 'users', auth: true },
    } as unknown as Collection,
    'payload-preferences': {
      config: { slug: 'payload-preferences', auth: false },
    } as unknown as Collection,
    'internal-data': {
      config: { slug: 'internal-data', auth: false, access: { read: false } },
    } as unknown as Collection,
  }

  const mockFields: Field[] = [
    { type: 'text', name: 'title' } as Field,
    { type: 'password', name: 'password' } as Field,
    { type: 'text', name: 'email' } as Field,
    { type: 'text', name: '_internal' } as Field,
    { type: 'text', name: 'secretKey' } as Field,
  ]

  describe('filterCollections with hideInternalCollections', () => {
    it('should hide payload-* collections when hideInternalCollections is true', () => {
      const result = filterCollections(mockCollections, {
        hideInternalCollections: true,
      })
      expect(result).toHaveLength(3)
      expect(result.map(c => c.config.slug)).not.toContain('payload-preferences')
    })

    it('should include payload-* collections when hideInternalCollections is false', () => {
      const result = filterCollections(mockCollections, {
        hideInternalCollections: false,
      })
      expect(result).toHaveLength(4)
      expect(result.map(c => c.config.slug)).toContain('payload-preferences')
    })

    it('should combine hideInternalCollections with other filters', () => {
      const result = filterCollections(mockCollections, {
        hideInternalCollections: true,
        includeCollections: ['posts', 'users', 'payload-preferences'],
      })
      expect(result).toHaveLength(2)
      expect(result.map(c => c.config.slug)).toEqual(['posts', 'users'])
    })
  })

  describe('shouldIncludeOperation', () => {
    const mockCollection = mockCollections.posts

    it('should include all operations when no filter is provided', () => {
      const operations: CRUDOperation[] = ['create', 'read', 'update', 'delete', 'list']
      for (const op of operations) {
        expect(shouldIncludeOperation(op, mockCollection, {})).toBe(true)
      }
    })

    it('should only include specified operations when includeOperations is set', () => {
      const options = {
        operations: {
          includeOperations: ['read', 'list'] as CRUDOperation[],
        },
      }

      expect(shouldIncludeOperation('read', mockCollection, options)).toBe(true)
      expect(shouldIncludeOperation('list', mockCollection, options)).toBe(true)
      expect(shouldIncludeOperation('create', mockCollection, options)).toBe(false)
      expect(shouldIncludeOperation('delete', mockCollection, options)).toBe(false)
    })

    it('should exclude specified operations when excludeOperations is set', () => {
      const options = {
        operations: {
          excludeOperations: ['delete', 'create'] as CRUDOperation[],
        },
      }

      expect(shouldIncludeOperation('read', mockCollection, options)).toBe(true)
      expect(shouldIncludeOperation('update', mockCollection, options)).toBe(true)
      expect(shouldIncludeOperation('delete', mockCollection, options)).toBe(false)
      expect(shouldIncludeOperation('create', mockCollection, options)).toBe(false)
    })

    it('should use custom operationFilter when provided', () => {
      const options = {
        operations: {
          operationFilter: (operation: CRUDOperation, collection: any) => {
            // Only allow read operations for posts
            if (collection.slug === 'posts') {
              return operation === 'read'
            }
            return true
          },
        },
      }

      expect(shouldIncludeOperation('read', mockCollection, options)).toBe(true)
      expect(shouldIncludeOperation('create', mockCollection, options)).toBe(false)
    })
  })

  describe('filterFields', () => {
    const mockCollection = mockCollections.posts

    it('should return all fields when no filter is provided', () => {
      const result = filterFields(mockFields, mockCollection, {})
      expect(result).toHaveLength(5)
    })

    it('should exclude specified fields when excludeFields is an array', () => {
      const result = filterFields(mockFields, mockCollection, {
        excludeFields: ['password', 'secretKey'],
      })
      expect(result.map(f => (f as any).name)).not.toContain('password')
      expect(result.map(f => (f as any).name)).not.toContain('secretKey')
      expect(result.map(f => (f as any).name)).toContain('title')
    })

    it('should use custom field filter function', () => {
      const result = filterFields(mockFields, mockCollection, {
        excludeFields: ({ name, type }) => {
          return type === 'password' || name.startsWith('_')
        },
      })
      expect(result.map(f => (f as any).name)).not.toContain('password')
      expect(result.map(f => (f as any).name)).not.toContain('_internal')
      expect(result.map(f => (f as any).name)).toContain('title')
      expect(result.map(f => (f as any).name)).toContain('secretKey')
    })

    it('should use custom field filter function with collection information', () => {
      const result = filterFields(mockFields, mockCollection, {
        excludeFields: ({ name, type, collection }) => {
          // Different rules for different collections
          if (collection.slug === 'posts') {
            // For posts, exclude password and internal fields
            return type === 'password' || name.startsWith('_')
          }
          // For other collections, only exclude password
          return type === 'password'
        },
      })
      expect(result.map(f => (f as any).name)).not.toContain('password')
      expect(result.map(f => (f as any).name)).not.toContain('_internal')
      expect(result.map(f => (f as any).name)).toContain('title')
      expect(result.map(f => (f as any).name)).toContain('secretKey')
    })

    it('should filter differently for different collections', () => {
      const usersCollection = mockCollections.users

      // For users collection, exclude different fields
      const result = filterFields(mockFields, usersCollection, {
        excludeFields: ({ name, collection }) => {
          if (collection.slug === 'users') {
            // For users, exclude secretKey but allow _internal
            return name === 'secretKey'
          }
          return false
        },
      })
      expect(result.map(f => (f as any).name)).toContain('password')
      expect(result.map(f => (f as any).name)).toContain('_internal')
      expect(result.map(f => (f as any).name)).not.toContain('secretKey')
      expect(result.map(f => (f as any).name)).toContain('title')
    })
  })

  describe('operation filtering integration', () => {
    it('should respect excludeOperations configuration', () => {
      const mockCollection = mockCollections.posts

      // Test that delete operation is excluded
      const options = {
        operations: {
          excludeOperations: ['delete'] as CRUDOperation[],
        },
      }

      expect(shouldIncludeOperation('create', mockCollection, options)).toBe(true)
      expect(shouldIncludeOperation('read', mockCollection, options)).toBe(true)
      expect(shouldIncludeOperation('update', mockCollection, options)).toBe(true)
      expect(shouldIncludeOperation('list', mockCollection, options)).toBe(true)
      expect(shouldIncludeOperation('delete', mockCollection, options)).toBe(false)
    })

    it('should respect includeOperations configuration', () => {
      const mockCollection = mockCollections.posts

      // Test that only read and list operations are included
      const options = {
        operations: {
          includeOperations: ['read', 'list'] as CRUDOperation[],
        },
      }

      expect(shouldIncludeOperation('read', mockCollection, options)).toBe(true)
      expect(shouldIncludeOperation('list', mockCollection, options)).toBe(true)
      expect(shouldIncludeOperation('create', mockCollection, options)).toBe(false)
      expect(shouldIncludeOperation('update', mockCollection, options)).toBe(false)
      expect(shouldIncludeOperation('delete', mockCollection, options)).toBe(false)
    })

    it('should respect custom operationFilter', () => {
      const mockCollection = mockCollections.posts

      // Test custom operation filter
      const options = {
        operations: {
          operationFilter: (operation: CRUDOperation, collection: any) => {
            // Only allow read operations for posts
            if (collection.slug === 'posts') {
              return operation === 'read' || operation === 'list'
            }
            return true
          },
        },
      }

      expect(shouldIncludeOperation('read', mockCollection, options)).toBe(true)
      expect(shouldIncludeOperation('list', mockCollection, options)).toBe(true)
      expect(shouldIncludeOperation('create', mockCollection, options)).toBe(false)
      expect(shouldIncludeOperation('update', mockCollection, options)).toBe(false)
      expect(shouldIncludeOperation('delete', mockCollection, options)).toBe(false)
    })
  })
})
