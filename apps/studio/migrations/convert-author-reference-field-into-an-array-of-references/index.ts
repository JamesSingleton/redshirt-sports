import { append, at, defineMigration, setIfMissing } from 'sanity/migrate'

export default defineMigration({
  title: 'Convert author reference field into an array of references',
  documentTypes: ['post'],
  filter:
    'defined(author) && (!defined(authors) || !array::intersects([author._ref], authors[]._ref))',
  migrate: {
    document(post) {
      return [
        at('authors', setIfMissing([])),
        at('authors', append(post.author)),
        // at('author', unset()),
      ]
    },
  },
})
