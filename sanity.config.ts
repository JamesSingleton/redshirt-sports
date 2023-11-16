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
import DocumentsPane from 'sanity-plugin-documents-pane'
import { PortableTextInputProps } from 'sanity'

import { schemaTypes } from '@schemas/index'
import { apiVersion, projectId } from '@lib/sanity.api'
import { deskStructure } from '@plugins/deskStructure'
import { CustomBlockContentInput } from '@plugins/CustomBlockContentInput'

export default defineConfig({
  basePath: '/studio',
  title: 'Redshirt Sports',
  projectId: projectId,
  dataset: 'production',
  schema: {
    types: schemaTypes,
    templates: (prev, context) => [
      {
        id: 'school',
        title: 'School Child',
        schemaType: 'school',
        parameters: [
          {
            name: 'conference',
            type: 'string',
          },
          {
            name: 'division',
            type: 'string',
          },
        ],
        value: ({ conferenceId, divisionId }: { conferenceId: string; divisionId: string }) => {
          return {
            division: { _type: 'reference', _ref: divisionId },
            conference: { _type: 'reference', _ref: conferenceId },
          }
        },
      },
      {
        id: 'post-child',
        title: 'Post Child',
        schemaType: 'post',
        parameters: [
          {
            name: 'division',
            type: 'string',
          },
        ],
        value: ({ divisionId }: { divisionId: string }) => ({
          division: { _type: 'reference', _ref: divisionId },
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
      defaultDocumentNode: (S, { schemaType }) => {
        const views = [
          // Default form view
          S.view.form(),
          // Incoming References
          S.view
            .component(DocumentsPane)
            .options({
              query: `*[references($id)] | order(_createdAt desc)`,
              params: { id: `_id` },
              useDraft: false,
            })
            .title('Incoming References'),
        ]
        return S.document().views(views)
      },
    }),
    visionTool({
      defaultApiVersion: apiVersion,
    }),
    dashboardTool({
      widgets: [sanityTutorialsWidget(), projectInfoWidget(), projectUsersWidget()],
    }),
    media(),
  ],
  tools: (prev, context) => {
    const isAdmin = context.currentUser?.roles?.find(({ name }) => name === 'administrator')

    if (isAdmin) {
      return prev
    }

    return prev.filter((tool) => tool.name !== 'vision')
  },
  form: {
    components: {
      input: (props) => {
        if (props.schemaType.name === 'blockContent') {
          return CustomBlockContentInput(props as PortableTextInputProps)
        }

        return props.renderDefault(props)
      },
    },
  },
})
