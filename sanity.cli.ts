// sanity.cli.js
import { defineCliConfig } from 'sanity/cli'
import path from 'path'

export default defineCliConfig({
  api: {
    projectId: '8pbt9f8w', // replace value with your own
    dataset: 'production', // replace value with your own
  },
  vite: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Add your own aliases here
      // Example: "react": "preact/compat"
      '@plugins': path.resolve(__dirname, './plugins'),
      '@schemas': path.resolve(__dirname, './schemas'),
      '@lib': path.resolve(__dirname, './lib'),
    }
    return config
  },
})
