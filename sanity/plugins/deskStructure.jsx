import { School, Newspaper, Users, Gavel, Repeat, Folder } from 'lucide-react'

export const deskStructure = async (S, context) => {
  const { getClient, currentUser } = context

  const client = getClient({ apiVersion: '2023-01-01' })

  const divisions = await client.fetch('*[_type == "division" && !(_id in path("drafts.**"))]')

  const items = [
    ...divisions
      .map((division) => {
        return S.listItem()
          .title(`${division.name} Articles`)
          .icon(Newspaper)
          .id(division._id)
          .schemaType('post')
          .child(() =>
            S.documentList('post')
              .schemaType('post')
              .title(`${division.name} Articles`)
              .menuItems(S.documentTypeList('post').getMenuItems())
              .filter(`_type == "post" && division->_id == "${division._id}"`)
              .canHandleIntent(S.documentTypeList('post').getCanHandleIntent())
              .initialValueTemplates([
                S.initialValueTemplateItem('post-child', {
                  categoryId: division._id,
                }),
              ]),
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
    // parentChild(S, context),
    // S.documentTypeListItem('player').title('Player Profiles'),
    // S.documentTypeListItem('transferPortal').title('Transfer Portal Players'),

    // Schools
    S.listItem()
      .title('Schools')
      .icon(School)
      .child(
        S.documentTypeList('division')
          .filter('_type == "division" && !(_id in path("drafts.**"))')
          .defaultOrdering([{ field: 'name', direction: 'asc' }])
          .title('Divisions')
          .child((divisionId) =>
            S.documentList()
              .title('Conferences')
              .defaultOrdering([{ field: 'name', direction: 'asc' }])
              .filter('_type == "conference" && defined(division) && division._ref == $divisionId')
              .params({ divisionId })
              .canHandleIntent(S.documentTypeList('division').getCanHandleIntent())
              .initialValueTemplates([
                S.initialValueTemplateItem('conference-child', {
                  categoryId: divisionId,
                }),
              ])
              .child((conferenceId) =>
                S.documentList()
                  .title('Schools')
                  .defaultOrdering([{ field: 'name', direction: 'asc' }])
                  .filter('_type == "school" && $conferenceId == conference._ref')
                  .params({ conferenceId })
                  .canHandleIntent(S.documentTypeList('school').getCanHandleIntent())
                  .initialValueTemplates([
                    S.initialValueTemplateItem('school-child', {
                      conferenceId,
                    }),
                  ]),
              ),
          ),
      ),
    S.listItem()
      .title('Divisions')
      .icon(Folder)
      .child(S.documentTypeList('division').defaultOrdering([{ field: 'name', direction: 'asc' }])),
    S.listItem()
      .title('Conferences')
      .icon(Folder)
      .child(
        S.documentTypeList('division')
          .defaultOrdering([{ field: 'name', direction: 'asc' }])
          .canHandleIntent(S.documentTypeList('division').getCanHandleIntent())
          .child((divisionId) =>
            S.documentList()
              .id('conference')
              .title('Conferences')
              .filter('_type == "conference" && division._ref == $divisionId')
              .params({ divisionId })
              .canHandleIntent(S.documentTypeList('conference').getCanHandleIntent())
              .defaultOrdering([{ field: 'name', direction: 'asc' }])
              .initialValueTemplates([
                S.initialValueTemplateItem('conference', {
                  divisionId,
                }),
              ]),
          ),
      ),
    S.divider(),
    S.listItem()
      .title('Articles by year')
      .icon(Newspaper)
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
                        .params({ ids: years[year] }),
                    )
                }),
              )
          })
      }),
    S.documentTypeListItem('author').title('Team Members').icon(Users),
  ]

  if (currentUser && currentUser.role === 'administrator') {
    items.push(S.documentTypeListItem('legal').title('Legal Documents').icon(Gavel)),
      items.push(S.documentTypeListItem('redirect').title('Redirects').icon(Repeat))
  }

  return S.list().title('Content').items(items)
}
