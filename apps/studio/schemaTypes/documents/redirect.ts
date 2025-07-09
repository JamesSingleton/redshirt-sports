import type { SanityDocumentLike } from 'sanity'
import { defineField, defineType } from 'sanity'

function isValidInternalPath(value: string | undefined) {
  if (!value) {
    return 'Value is required'
  } else if (!value.startsWith('/')) {
    return 'Internal paths must start with /'
  } else if (/[^a-zA-Z0-9\-_/:*]/.test(value)) {
    return 'Source path contains invalid characters'
  } else if (/:[^/]+:/.test(value)) {
    return 'Parameters can only contain one : directly after /'
  } else if (value.split('/').some((part) => part.includes(':') && !part.startsWith(':'))) {
    return 'The : character can only appear directly after /'
  }
  return true
}

function isValidUrl(value: string | undefined) {
  try {
    new URL(value || '')
    return true
  } catch {
    return 'Invalid URL'
  }
}

export const redirect = defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  validation: (rule) =>
    rule.custom((doc: SanityDocumentLike | undefined) => {
      if (doc && doc.source === doc.destination) {
        return ['source', 'destination'].map((field) => ({
          message: 'Source and desitination cannot be the same',
          path: [field],
        }))
      }

      return true
    }),
  fields: [
    defineField({
      name: 'source',
      type: 'string',
      validation: (rule) => rule.required().custom(isValidInternalPath),
    }),
    defineField({
      name: 'destination',
      type: 'string',
      validation: (rule) =>
        rule.required().custom((value: string | undefined) => {
          const urlValidation = isValidUrl(value)
          const pathValidation = isValidInternalPath(value)

          if (urlValidation === true || pathValidation === true) {
            return true
          }

          return typeof urlValidation === 'boolean' ? urlValidation : pathValidation
        }),
    }),
    defineField({
      name: 'permanent',
      description: 'Should the redirect be permanent (301) or temporary (302)',
      type: 'boolean',
      initialValue: true,
    }),
  ],
})
