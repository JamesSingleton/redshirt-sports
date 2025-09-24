import { type DuplicateDocumentActionComponent } from 'sanity'

export function createCustomPostDuplicateAction(
  originalAction: DuplicateDocumentActionComponent,
): DuplicateDocumentActionComponent {
  return function CustomDuplicateAction(props) {
    return originalAction({
      ...props,
      mapDocument: ({ slug, publishedAt, ...document }) => document,
    })
  }
}
