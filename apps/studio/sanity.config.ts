import { assist } from '@sanity/assist'
import { visionTool } from '@sanity/vision'
import { table } from '@sanity/table'
import { defineConfig, PortableTextInputProps } from 'sanity'
import { presentationTool } from 'sanity/presentation'
import { structureTool } from 'sanity/structure'
import { media, mediaAssetSource } from 'sanity-plugin-media'

import { presentationUrl } from './plugins/presentation-url'
import { Logo } from './components/logo'
import { locations } from './location'
import { schemaTypes } from './schemaTypes'
import { structure } from './structure'
import { BlockContentInput } from './components/block-content-input'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? ''
const dataset = process.env.SANITY_STUDIO_DATASET
const title = process.env.SANITY_STUDIO_TITLE
const presentationOriginUrl = process.env.SANITY_STUDIO_PRESENTATION_URL

export default defineConfig({
  title: title ?? 'Redshirt Sports Studio',
  projectId: projectId,
  icon: Logo,
  dataset: dataset ?? 'production',
  plugins: [
    presentationTool({
      resolve: {
        locations,
      },
      previewUrl: {
        origin: presentationOriginUrl ?? 'http://localhost:3000',
        previewMode: {
          enable: '/api/presentation-draft',
        },
      },
    }),
    assist(),
    structureTool({
      structure,
    }),
    visionTool(),
    media({
      creditLine: {
        enabled: true,
      },
    }),
    presentationUrl(),
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
    newDocumentOptions: (prev, { creationContext }) => {
      const { type } = creationContext
      if (type === 'global') return []
      return prev
    },
  },
  schema: {
    types: schemaTypes,
  },
})
