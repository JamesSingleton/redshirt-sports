import {
  CogIcon,
  Folder,
  FileText,
  type LucideIcon,
  PanelBottomIcon,
  PanelTopDashedIcon,
  Settings2,
  User,
  UniversityIcon,
  TagIcon,
  GavelIcon,
  RefreshCcw,
} from 'lucide-react'
import { LinkIcon, ComposeIcon } from '@sanity/icons'
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
      return S.document().views([S.view.form().icon(ComposeIcon), incomingReferences(S)])
    default:
      return S.document().views([S.view.form(), incomingReferences(S)])
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

export const structure = (S: StructureBuilder, context: StructureResolverContext) => {
  const { currentUser } = context
  const items = [
    createList({ S, type: 'post', title: 'Articles', icon: FileText }),
    S.divider(),
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
    S.divider(),
    createList({
      S,
      type: 'tag',
      title: 'Tags',
      icon: TagIcon,
    }),
    S.divider(),
    createList({ S, type: 'author', title: 'Authors', icon: User }),
  ]

  if (currentUser && currentUser?.roles?.find(({ name }) => name === 'administrator')) {
    items.push(S.divider())
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
