import { assist } from '@sanity/assist'
import {
  dashboardTool,
  projectInfoWidget,
  projectUsersWidget,
  sanityTutorialsWidget,
} from '@sanity/dashboard'
import { table } from '@sanity/table'
import { visionTool } from '@sanity/vision'
import type { PortableTextInputProps } from 'sanity'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { media, mediaAssetSource } from 'sanity-plugin-media'

import { BlockContentInput } from './components/block-content-input'
import { Logo } from './components/logo'
import { schemaTypes } from './schemaTypes'
import { getDefaultDocumentNode, structure } from './structure'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? ''
const dataset = process.env.SANITY_STUDIO_DATASET
const title = process.env.SANITY_STUDIO_TITLE

export default defineConfig({
  title: title ?? 'Redshirt Sports Studio',
  projectId: projectId,
  icon: Logo,
  dataset: dataset ?? 'production',
  mediaLibrary: {
    enabled: true,
  },
  plugins: [
    assist(),
    structureTool({
      structure,
      defaultDocumentNode: getDefaultDocumentNode,
    }),
    visionTool(),
    dashboardTool({
      widgets: [sanityTutorialsWidget(), projectInfoWidget(), projectUsersWidget()],
    }),
    media({
      creditLine: {
        enabled: true,
      },
    }),
    table(),
  ],
  form: {
    image: {
      assetSources: (previousAssetSources) => {
        return previousAssetSources.filter((assetSource) => assetSource === mediaAssetSource)
      },
    },
    components: {
      input: (props) => {
        if (props.schemaType.name === 'blockContent') {
          return BlockContentInput(props as PortableTextInputProps)
        }

        return props.renderDefault(props)
      },
    },
  },
  document: {
    newDocumentOptions: (prev, { creationContext, currentUser }) => {
      const { type } = creationContext
      const isAdmin = currentUser?.roles?.find(({ name }) => name === 'administrator')

      if (type === 'global') {
        if (!isAdmin) {
          return prev.filter(
            (option) =>
              option.templateId !== 'settings' &&
              option.templateId !== 'legal' &&
              option.templateId !== 'redirect' &&
              option.templateId !== 'footer' &&
              option.templateId !== 'navbar',
          )
        }

        return prev
      }
      return prev
    },
  },
  schema: {
    types: schemaTypes,
  },
})
