// This plugin is responsible for adding a “Preview” tab to the document pane
// You can add any React component to `S.view.component` and it will be rendered in the pane
// and have access to content in the form in real-time.
// It's part of the Studio's “Structure Builder API” and is documented here:
// https://www.sanity.io/docs/structure-builder-reference

import { DefaultDocumentNodeResolver } from 'sanity/desk'
import DocumentsPane from 'sanity-plugin-documents-pane'
import postType from '@schemas/documents/post'

import { PreviewPane } from './PostPreviewPane'

export const previewDocumentNode = ({
  apiVersion,
  previewSecretId,
}: {
  apiVersion: string
  previewSecretId: `${string}.${string}`
}): DefaultDocumentNodeResolver => {
  return (S, { schemaType }) => {
    switch (schemaType) {
      case postType.name:
        return S.document().views([
          S.view.form(),
          S.view
            .component((props) => (
              <PreviewPane previewSecretId={previewSecretId} apiVersion={apiVersion} {...props} />
            ))
            .title('Preview'),
          S.view
            .component(DocumentsPane)
            .options({
              query: `*[references($id)]`,
              params: { id: `_id` },
              useDraft: false,
            })
            .title('Incoming References'),
        ])

      default:
        return null
    }
  }
}
