import DocumentsPane from 'sanity-plugin-documents-pane'
import { Preflight, DeadLinks } from '@planetary/sanity-plugin-preflight'
import { RocketIcon, LinkIcon, ComposeIcon } from '@sanity/icons'

import {
  type StructureBuilder,
  type DefaultDocumentNodeResolver,
  type StructureResolver,
} from 'sanity/structure'
import { apiVersion } from '@/lib/sanity.api'
import { articlesByYear } from './articles-by-year'
import { Division } from '@/types'

const incomingReferences = (S: StructureBuilder) =>
  S.view
    .component(DocumentsPane)
    .options({
      query: `*[references($id)] | order(_createdAt desc)`,
      params: { id: `_id` },
      useDraft: false,
    })
    .title('Incoming References')
    .icon(LinkIcon)

export const getDefaultDocumentNode: DefaultDocumentNodeResolver = (S, { schemaType }) => {
  switch (schemaType) {
    case 'post':
      return S.document().views([
        S.view.form().icon(ComposeIcon),
        incomingReferences(S),
        S.view
          .component(
            Preflight({
              plugins: [DeadLinks()],
            }),
          )
          .title('Preflight')
          .icon(RocketIcon),
      ])
    default:
      return S.document().views([S.view.form(), incomingReferences(S)])
  }
}

export const structure: StructureResolver = async (S, context) => {
  const { currentUser, getClient } = context
  const client = getClient({ apiVersion })

  // get divisions
  const divisions: Division[] = await client.fetch(
    '*[_type == "division" && !(_id in path("drafts.**"))]',
  )

  const items = [
    ...divisions.map((division) =>
      S.listItem()
        .title(`${division.name} Articles`)
        .id(division._id)
        .schemaType('post')
        .child(
          S.documentList()
            .schemaType('post')
            .title(`${division.name} Articles`)
            .filter('_type == "post" && division._ref == $divisionId')
            .apiVersion(apiVersion)
            .params({ divisionId: division._id })
            .canHandleIntent(S.documentTypeList('post').getCanHandleIntent())
            .menuItems(S.documentTypeList('post').getMenuItems())
            .initialValueTemplates([
              S.initialValueTemplateItem('post-child', {
                divisionId: division._id,
              }),
            ]),
        ),
    ),
    S.documentTypeListItem('school')
      .title('Schools')
      .child(
        S.documentTypeList('division').child((divisionId) =>
          S.documentList()
            .id('conference')
            .title('Conferences')
            .filter('_type == "conference" && division._ref == $divisionId')
            .apiVersion(apiVersion)
            .params({ divisionId })
            .defaultOrdering([{ field: 'name', direction: 'asc' }])
            .initialValueTemplates([
              S.initialValueTemplateItem('conference', {
                divisionId,
              }),
            ])
            .child((conferenceId) =>
              S.documentList()
                .id('school')
                .title('Schools')
                .filter('_type == "school" && conference._ref == $conferenceId')
                .apiVersion(apiVersion)
                .params({ conferenceId })
                .canHandleIntent(S.documentTypeList('school').getCanHandleIntent())
                .defaultOrdering([{ field: 'name', direction: 'asc' }])
                .initialValueTemplates([
                  S.initialValueTemplateItem('school', {
                    conferenceId,
                  }),
                ]),
            ),
        ),
      ),
    S.documentTypeListItem('division').title('Divisions'),
    S.documentTypeListItem('conference')
      .title('Conferences')
      .child(
        S.documentTypeList('division').child((divisionId) =>
          S.documentList()
            .id('conference')
            .title('Conferences')
            .filter('_type == "conference" && division._ref == $divisionId')
            .apiVersion(apiVersion)
            .params({ divisionId })
            .initialValueTemplates([
              S.initialValueTemplateItem('conference', {
                divisionId,
              }),
            ]),
        ),
      ),
    S.documentTypeListItem('tag').title('Tags'),
    S.divider(),
    S.documentTypeListItem('author').title('Authors'),
    articlesByYear(S),
    S.documentTypeListItem('post').title('All Articles'),
  ]

  if (currentUser && currentUser?.roles?.find(({ name }) => name === 'administrator')) {
    items.push(S.documentTypeListItem('legal').title('Legal Documents'))
    items.push(S.documentTypeListItem('redirect').title('Redirects'))
  }
  return S.list().title('Content').items(items)
}
