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
import type { StructureBuilder, StructureResolverContext } from 'sanity/structure'

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

type CreateIndexList = {
  S: StructureBuilder
  list: Base
  index: Base<SingletonType>
}

const createIndexList = ({ S, index, list }: CreateIndexList) => {
  const indexTitle = index.title ?? getTitleCase(index.type)
  const listTitle = list.title ?? getTitleCase(list.type)
  return S.listItem()
    .title(listTitle)
    .icon(index.icon ?? Folder)
    .child(
      S.list()
        .title(indexTitle)
        .items([
          S.listItem()
            .title(indexTitle)
            .icon(index.icon ?? Folder)
            .child(
              S.document().views([S.view.form()]).schemaType(index.type).documentId(index.type),
            ),
          S.documentTypeListItem(list.type)
            .title(`${listTitle}`)
            .icon(list.icon ?? Folder),
        ]),
    )
}

export const structure = (S: StructureBuilder, context: StructureResolverContext) => {
  return S.list()
    .title('Content')
    .items([
      // createSingleTon({ S, type: 'homePage', icon: HomeIcon }),

      createList({ S, type: 'post', title: 'Articles', icon: FileText }),
      // createIndexList({
      //   S,
      //   // index: { type: 'blogIndex', icon: BookMarked },
      //   list: { type: 'post', title: 'Posts', icon: FileText },
      // }),
      S.divider(),
      createList({
        S,
        type: 'division',
        title: 'Divisions',
      }),
      createList({
        S,
        type: 'conference',
        title: 'Conferences',
      }),
      createList({
        S,
        type: 'school',
        title: 'Schools',
        icon: UniversityIcon,
      }),
      S.divider(),
      createList({
        S,
        type: 'tag',
        title: 'Tags',
        icon: TagIcon,
      }),
      S.divider(),
      createList({ S, type: 'author', title: 'Authors', icon: User }),
      S.divider(),
      createList({ S, type: 'legal', title: 'Legal Documents', icon: GavelIcon }),
      createList({ S, type: 'redirect', title: 'Redirects', icon: RefreshCcw }),
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
    ])
}
