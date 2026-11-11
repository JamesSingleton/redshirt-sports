import type { DuplicateDocumentActionComponent } from "sanity";

export function createCustomPostDuplicateAction(
  originalAction: DuplicateDocumentActionComponent,
): DuplicateDocumentActionComponent {
  return function CustomDuplicateAction(props) {
    return originalAction({
      ...props,
      // A copy is a new article: it gets its own URL and dates, and the
      // original's correction log stays with the original.
      mapDocument: ({
        slug: _slug,
        publishedAt: _publishedAt,
        modifiedAt: _modifiedAt,
        corrections: _corrections,
        ...document
      }) => document,
    });
  };
}
