import DocumentsPane from 'sanity-plugin-documents-pane'
import { DocumentsIcon } from '@sanity/icons'
import { HomeIcon } from '@sanity/icons'

import parentChild from './parentChild'

export const defaultDocumentNodeResolver = (S) => {
  return S.document().views([
    S.view.form(),
    S.view
      .component(DocumentsPane)
      .options({
        query: `*[references($id)]`,
        params: { id: `_id` },
        useDraft: false,
      })
      .title('Incoming References'),
  ])
}

export const deskStructure = async (S, context) => {
  const { getClient, currentUser } = context

  const client = getClient({ apiVersion: '2023-01-01' })

  const categories = await client.fetch(
    '*[_type == "category" && !defined(parent) && !(_id in path("drafts.**"))]'
  )

  const items = [
    // Articles by Category
    ...categories
      .map((category) => {
        return S.listItem()
          .title(`${category.title} Articles`)
          .id(category._id)
          .schemaType('post')
          .child(() =>
            S.documentList('post')
              .schemaType('post')
              .title(`${category.title} Articles`)
              .menuItems(S.documentTypeList('post').getMenuItems())
              .filter(`_type == "post" && parentCategory->_id == "${category._id}"`)
              .canHandleIntent(S.documentTypeList('post').getCanHandleIntent())
              .initialValueTemplates([
                S.initialValueTemplateItem('post-child', {
                  categoryId: category._id,
                }),
              ])
          )
      })
      .sort((a, b) => {
        if (a.spec.title < b.spec.title) {
          return -1
        }
        if (a.spec.title > b.spec.title) {
          return 1
        }
        return 0
      }),
    // Categories
    parentChild(S, context),
    S.documentTypeListItem('player').title('Player Profiles'),
    S.documentTypeListItem('transferPortal').title('Transfer Portal Players'),

    // Schools
    S.listItem()
      .title('Schools by Conference')
      .icon(HomeIcon)
      .child(
        S.documentTypeList('category')
          .filter(
            '_type == "category" && !(title in ["FBS", "FCS", "D2", "D3", "Transfer Portal", "All-Star Games"])'
          )
          .defaultOrdering([{ field: 'title', direction: 'asc' }])
          .title('Schools by Conference')
          .child((categoryId) =>
            S.documentList()
              .title('Schools')
              .filter('_type == "school" && $categoryId == conference._ref')
              .params({ categoryId })
              .canHandleIntent(S.documentTypeList('school').getCanHandleIntent())
              .initialValueTemplates([
                S.initialValueTemplateItem('school-child', {
                  categoryId,
                }),
              ])
          )
      ),
    S.divider(),
    S.listItem()
      .title('Articles by year')
      .icon(DocumentsIcon)
      .child(() => {
        const type = 'post'
        return client
          .fetch('* [_type == $type && defined(publishedAt)] {_id, _type, publishedAt}', {
            type,
          })
          .then((docs) => {
            // Create a map of years
            const years = {}
            docs.forEach((d) => {
              const date = new Date(d.publishedAt)
              const year = date.getFullYear()
              if (!years[year]) {
                years[year] = []
              }
              years[year].push(d._id)
            })
            return S.list()
              .title('Posts by year')
              .id('year')
              .items(
                Object.keys(years).map((year) => {
                  return S.listItem()
                    .id(year)
                    .title(year)
                    .child(
                      S.documentList()
                        .id(type)
                        .title(`Posts from ${year}`)
                        .filter(`_id in $ids`)
                        .params({ ids: years[year] })
                    )
                })
              )
          })
      }),
    S.documentTypeListItem('author').title('Team Members'),
  ]

  if (currentUser && currentUser.role === 'administrator') {
    items.push(S.documentTypeListItem('legal').title('Legal Documents'))
  }

  return S.list().title('Content').items(items)
}
