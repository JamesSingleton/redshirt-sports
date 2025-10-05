import { ComposeIcon, LinkIcon } from '@sanity/icons'
import {
  CogIcon,
  FileText,
  Folder,
  GavelIcon,
  type LucideIcon,
  PanelBottomIcon,
  PanelTopDashedIcon,
  RefreshCcw,
  Settings2,
  TagIcon,
  UniversityIcon,
  User,
} from 'lucide-react'
import type {
  DefaultDocumentNodeResolver,
  StructureBuilder,
  StructureResolverContext,
} from 'sanity/structure'
import DocumentsPane from 'sanity-plugin-documents-pane'

import type { SchemaType, SingletonType } from './schemaTypes'
import { getTitleCase } from './utils/helper'

type Base<T = SchemaType> = {
  id?: string
  type: T
  preview?: boolean
  title?: string
  icon?: LucideIcon
}

type CreateSingleTon = {
  S: StructureBuilder
} & Base<SingletonType>

const postReferences = (S: StructureBuilder) =>
  S.view
    .component(DocumentsPane)
    .options({
      query: `*[_type == 'post' && references($id)] | order(_createdAt desc)`,
      params: { id: `_id` },
      useDraft: false,
    })
    .title('Post References')
    .icon(LinkIcon)

const schoolReferences = (S: StructureBuilder) =>
  S.view
    .component(DocumentsPane)
    .options({
      query: `*[_type == 'school' && references($id)] | order(_createdAt desc)`,
      params: { id: `_id` },
      useDraft: false,
    })
    .title('School References')
    .icon(LinkIcon)

export const getDefaultDocumentNode: DefaultDocumentNodeResolver = (S, { schemaType }) => {
  switch (schemaType) {
    case 'post':
      return S.document().views([S.view.form().icon(ComposeIcon), postReferences(S)])
    case 'conference':
      return S.document().views([
        S.view.form().icon(ComposeIcon),
        postReferences(S),
        schoolReferences(S),
      ])
    case 'school':
      return S.document().views([S.view.form().icon(ComposeIcon), postReferences(S)])
    default:
      return S.document().views([S.view.form()])
  }
}

const createSingleTon = ({ S, type, title, icon }: CreateSingleTon) => {
  const newTitle = title ?? getTitleCase(type)
  return S.listItem()
    .title(newTitle)
    .icon(icon ?? Folder)
    .child(S.document().schemaType(type).documentId(type))
}

type CreateList = {
  S: StructureBuilder
} & Base

// This function creates a list item for a type. It takes a StructureBuilder instance (S),
// a type, an icon, and a title as parameters. It generates a title for the type if not provided,
// and uses a default icon if not provided. It then returns a list item with the generated or
// provided title and icon.

const createList = ({ S, type, icon, title, id }: CreateList) => {
  const newTitle = title ?? getTitleCase(type)
  return S.documentTypeListItem(type)
    .id(id ?? type)
    .title(newTitle)
    .icon(icon ?? Folder)
}

const createSportFilteredList = (S: StructureBuilder, sportId: string, sportName: string) => {
  return S.listItem()
    .title(`${sportName} Articles`)
    .icon(FileText)
    .id(`${sportId}-articles`)
    .child(
      S.documentList()
        .title(`${sportName} Articles`)
        .filter('_type == "post" && sport._ref == $sportId')
        .apiVersion('2025-06-11')
        .params({ sportId })
        .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
        .initialValueTemplates([S.initialValueTemplateItem('post-by-sport', { sportId })]),
    )
}

export const structure = async (S: StructureBuilder, context: StructureResolverContext) => {
  const { currentUser, getClient } = context
  const client = getClient({ apiVersion: '2025-06-11' })
  const sports = await client.fetch<Array<{ _id: string; title: string }>>(
    `*[_type == 'sport'] | order(title asc) {
        _id,
        title
      }`,
  )

  const items = [
    S.divider().title('Articles'),
    createList({ S, type: 'post', title: 'All Articles', icon: FileText, id: 'all-articles' }),
    ...sports.map((sport) => createSportFilteredList(S, sport._id, sport.title)),
    S.divider().title('Sports Organizational Structure'),
    createList({
      S,
      type: 'sport',
      title: 'Sports',
    }),
    createList({
      S,
      type: 'division',
      title: 'Divisions',
    }),
    createList({
      S,
      type: 'conference',
      title: 'Conferences',
    }).child(
      S.documentTypeList('conference')
        .title('Conferences')
        .defaultOrdering([{ field: 'name', direction: 'asc' }]),
    ),
    createList({
      S,
      type: 'school',
      title: 'Schools',
      icon: UniversityIcon,
    }).child(
      S.documentTypeList('school')
        .title('Schools')
        .defaultOrdering([{ field: 'name', direction: 'asc' }]),
    ),
    createList({
      S,
      type: 'sportSubgrouping',
      title: 'Sport Subgroupings',
    }),
    S.divider().title('Labeling'),
    createList({
      S,
      type: 'tag',
      title: 'Tags',
      icon: TagIcon,
    }),
    S.divider().title('Team'),
    createList({ S, type: 'author', title: 'Authors', icon: User }),
  ]

  if (currentUser && currentUser?.roles?.find(({ name }) => name === 'administrator')) {
    items.push(S.divider().title('Admin'))
    items.push(createList({ S, type: 'legal', title: 'Legal Documents', icon: GavelIcon }))
    items.push(createList({ S, type: 'redirect', title: 'Redirects', icon: RefreshCcw }))
    items.push(
      S.listItem()
        .title('Site Configuration')
        .icon(Settings2)
        .child(
          S.list()
            .title('Site Configuration')
            .items([
              createSingleTon({
                S,
                type: 'navbar',
                title: 'Navigation',
                icon: PanelTopDashedIcon,
              }),
              createSingleTon({
                S,
                type: 'footer',
                title: 'Footer',
                icon: PanelBottomIcon,
              }),
              createSingleTon({
                S,
                type: 'settings',
                title: 'Global Settings',
                icon: CogIcon,
              }),
            ]),
        ),
    )
  }

  return S.list().title('Content').items(items)
}
