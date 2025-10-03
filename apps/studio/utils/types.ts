import type {
  ObjectDefinition,
  ObjectOptions,
  ObjectSchemaType,
  SlugDefinition,
  SlugOptions,
} from 'sanity'

export type PathnameParams = Omit<SlugDefinition, 'type' | 'options' | 'name'> & {
  name?: string
  options?: SlugOptions
}

export type Page = {
  _rev: string
  _id: string
  _originalId: string
  _type: Exclude<'string', 'folder'>
  _updatedAt: string
  _createdAt: string
  slug: string | null
  children: Record<string, unknown>
}

export type PageTreeNode = Page & {
  title: string
  edited?: boolean
}

export type FolderTreeNode = Omit<Page, '_type'> & {
  _type: 'folder'
  title: string
  children: Tree
}

export type Tree = Record<string, TreeNode>

export type TreeNode = PageTreeNode | FolderTreeNode
