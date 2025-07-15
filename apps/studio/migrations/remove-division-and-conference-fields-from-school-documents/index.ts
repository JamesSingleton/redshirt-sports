import { at, defineMigration, unset } from 'sanity/migrate'

export default defineMigration({
  title: 'Remove division and conference fields from school documents',
  documentTypes: ['school'],
  migrate: {
    document(doc, context) {
      return [at('division', unset()), at('conference', unset())]
    },
  },
})
