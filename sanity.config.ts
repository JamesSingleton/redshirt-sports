import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import {
  dashboardTool,
  projectInfoWidget,
  projectUsersWidget,
  sanityTutorialsWidget,
} from '@sanity/dashboard'
import { media } from 'sanity-plugin-media'
import post from '@schemas/documents/post'
import author from '@schemas/documents/author'
import category from '@schemas/documents/category'
import legal from '@schemas/documents/legal'
import school from '@schemas/documents/school'
import player from '@schemas/documents/player'
import transferPortal from '@schemas/documents/transferPortal'
import mainImage from '@schemas/objects/mainImage'
import socialMedia from '@schemas/objects/socialMedia'
import twitter from '@schemas/objects/twitter'
import height from '@schemas/objects/height'
import position from '@schemas/objects/playerPosition'
import teamAssociation from '@schemas/objects/teamAssociation'
import blockContent from '@schemas/blockContent'
import { apiVersion, previewSecretId, projectId } from '@lib/sanity.api'
import { defaultDocumentNodeResolver, deskStructure } from '@plugins/deskStructure'
import { previewDocumentNode } from '@plugins/previewPane'
import { productionUrl } from '@plugins/productionUrl'

export const PREVIEWABLE_DOCUMENT_TYPES: string[] = [
  post.name,
  author.name,
  category.name,
  legal.name,
  school.name,
  player.name,
]

export default defineConfig({
  basePath: '/studio',
  title: 'Redshirt Sports',
  projectId: projectId!,
  dataset: 'production',
  schema: {
    types: [
      // Documents
      post,
      author,
      category,
      legal,
      school,
      player,
      transferPortal,
      // Objects
      mainImage,
      socialMedia,
      twitter,
      height,
      position,
      teamAssociation,
      // Block Content
      blockContent,
    ],
    templates: (prev, context) => [
      {
        id: 'category-child',
        title: 'Category Child',
        schemaType: 'category',
        parameters: [
          {
            name: 'parentId',
            type: 'string',
            title: 'Parent ID',
          },
        ],
        value: ({ parentId }: { parentId: string }) => ({
          parent: { _type: 'reference', _ref: parentId },
        }),
      },
      {
        id: 'school-child',
        title: 'School Child',
        schemaType: 'school',
        parameters: [
          {
            name: 'conference',
            type: 'string',
          },
        ],
        value: ({ categoryId }: { categoryId: string }) => ({
          conference: { _type: 'reference', _ref: categoryId },
        }),
      },
      {
        id: 'post-child',
        title: 'Post Child',
        schemaType: 'post',
        parameters: [
          {
            name: 'parentCategory',
            type: 'string',
          },
        ],
        value: ({ categoryId }: { categoryId: string }) => ({
          parentCategory: { _type: 'reference', _ref: categoryId },
        }),
      },
      ...prev,
    ],
  },
  plugins: [
    deskTool({
      structure: deskStructure,
      defaultDocumentNode: previewDocumentNode({ apiVersion, previewSecretId }),
    }),
    visionTool({
      defaultApiVersion: apiVersion,
    }),
    dashboardTool({
      widgets: [sanityTutorialsWidget(), projectInfoWidget(), projectUsersWidget()],
    }),
    media(),
    productionUrl({
      apiVersion,
      previewSecretId,
      types: PREVIEWABLE_DOCUMENT_TYPES,
    }),
  ],
  tools: (prev, context) => {
    const isAdmin = context.currentUser?.roles?.find(({ name }) => name === 'administrator')

    if (isAdmin) {
      return prev
    }

    return prev.filter((tool) => tool.name !== 'vision')
  },
})
