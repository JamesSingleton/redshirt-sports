import { at, defineMigration, setIfMissing } from 'sanity/migrate'

export default defineMigration({
  title: 'Add reference field sport to posts',
  documentTypes: ['post'],

  migrate: {
    document(doc, context) {
      return [
        at(
          'sport',
          setIfMissing({
            _type: 'reference',
            _ref: '511f1d00-2c5b-4467-963a-74ea901f9fc7', // ID of the document you want to reference
          }),
        ),
      ]
    },
  },
})
