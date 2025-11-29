import { defineCliConfig } from 'sanity/cli'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET

export default defineCliConfig({
  api: {
    projectId: projectId,
    dataset: dataset,
  },
  typegen: {
    path: '../../packages/sanity/src/*.{ts,tsx,js,jsx}',
    schema: 'schema.json',
    generates: '../../packages/sanity/src/types.ts',
    overloadClientMethods: true,
  },
})
