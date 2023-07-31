import { Path, SanityDocument, Schema, SchemaType, defineType } from 'sanity'

export const redirect = defineType({
  name: 'redirect',
  type: 'document',
  title: 'Redirect',
  fields: [
    {
      name: 'source',
      type: 'string',
      description: 'Relative URL path to direct from (e.g. /docs/starter-templates)',
      validation: (Rule) => [
        Rule.required(),
        Rule.custom(async (value: string | undefined, context) => {
          if (!value) return true
          if (!value.startsWith('/')) return 'Must be a URL path (e.g. /pricing)'
          if (isPattern(value)) return 'Cannot contain characters: (){}:*+?'
          if (!isValid(value)) return 'URL is not valid'
          const id = context.document?._id.replace('drafts.', '')!
          const unique = await isUnique(value, id, context)
          if (!unique) return 'Redirect for this source already exists'
          return true
        }),
      ],
    },
    {
      name: 'destination',
      type: 'string',
      description: 'Relative URL path to direct to (e.g. /templates)',
      validation: (Rule) => [
        Rule.required(),
        Rule.custom(async (value: string | undefined, context) => {
          if (!value) return true
          if (!value.startsWith('/')) return 'Must be a URL path (e.g. /pricing)'
          if (isPattern(value)) return 'Cannot contain characters: (){}:*+?'
          if (!isValid(value)) return 'URL is not valid'
          return true
        }),
      ],
    },
    {
      name: 'permanent',
      type: 'boolean',
      description: 'Whether to use a 308 Permanent Redirect or a 307 Temporary Redirect',
    },
  ],
  preview: {
    select: {
      title: 'source',
      subtitle: 'destination',
    },
  },
})

function isValid(path: string | URL) {
  try {
    return Boolean(new URL(path, 'https://www.redshirtsports.xyz'))
  } catch (error) {
    return false
  }
}

function isPattern(path: string) {
  return /[(){}:*+?]/.test(path)
}

async function isUnique(
  source: string,
  id: string,
  context: {
    getClient: any
    schema?: Schema
    parent?: unknown
    type?: SchemaType | undefined
    document?: SanityDocument | undefined
    path?: Path | undefined
    getDocumentExists?: ((options: { id: string }) => Promise<boolean>) | undefined
  },
) {
  if (!source) return true
  const { getClient } = context
  const client = getClient({ apiVersion: '2021-11-24' })
  const count = await client.fetch(
    'count(*[_type == "redirect" && _id != $id && source == $source && !(_id in path("drafts.**"))])',
    { source, id },
  )
  return count === 0
}
