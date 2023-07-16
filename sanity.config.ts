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

import { schemaTypes, PREVIEWABLE_DOCUMENT_TYPES } from '@schemas/index'
import { apiVersion, previewSecretId, projectId } from '@lib/sanity.api'
import { defaultDocumentNodeResolver, deskStructure } from '@plugins/deskStructure'
import { previewDocumentNode } from '@plugins/previewPane'
import { productionUrl } from '@plugins/productionUrl'

export default defineConfig({
  basePath: '/studio',
  title: 'Redshirt Sports',
  projectId: projectId,
  dataset: 'production',
  schema: {
    types: schemaTypes,
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
        value: ({ conferenceId }: { conferenceId: string }) => ({
          conference: { _type: 'reference', _ref: conferenceId },
        }),
      },
      {
        id: 'conference-child',
        title: 'Conference Child',
        schemaType: 'category',
        parameters: [
          {
            name: 'parentId',
            type: 'string',
            title: 'Parent ID',
          },
        ],
        value: ({ parentId }: { parentId: string }) => {
          return {
            parent: { _type: 'reference', _ref: parentId },
          }
        },
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
      {
        id: 'conference',
        schemaType: 'conference',
        title: 'Conference',
        parameters: [
          {
            name: 'divisionId',
            type: 'string',
          },
        ],
        value: ({ divisionId }: { divisionId: string }) => {
          return {
            division: { _type: 'reference', _ref: divisionId },
          }
        },
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
