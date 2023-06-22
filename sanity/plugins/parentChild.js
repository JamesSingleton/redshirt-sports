import { map } from 'rxjs/operators'
import { TagIcon } from '@sanity/icons'

export default function parentChild(S, context, schemaType = 'category') {
  const { documentStore } = context
  const categoryParents = `_type == "${schemaType}" && !defined(parent) && !(_id in path("drafts.**"))`

  return S.listItem(schemaType)
    .title('Article Categories')
    .icon(TagIcon)
    .child(() =>
      documentStore.listenQuery(`*[${categoryParents}]`).pipe(
        map((parents) =>
          S.list()
            .title('All Categories')
            .menuItems([
              S.menuItem()
                .title('Add Category')
                .intent({ type: 'create', params: { type: schemaType } }),
            ])
            .items([
              S.listItem()
                .title('Parent Categories')
                .schemaType(schemaType)
                .child(() =>
                  S.documentList()
                    .schemaType(schemaType)
                    .title('Parent Categories')
                    .filter(categoryParents)
                    .canHandleIntent(() => S.documentTypeList(schemaType).getCanHandleIntent())
                    .child((id) =>
                      S.document().documentId(id).views(S.view.form()).schemaType(schemaType)
                    )
                ),
              S.divider(),
              ...parents.map((parent) =>
                S.listItem({
                  id: parent._id,
                  title: parent.title,
                  schemaType,
                  child: () =>
                    S.documentTypeList(schemaType)
                      .title('Child Categories')
                      .filter(`_type == "${schemaType}" && parent._ref == $parentId`)
                      .params({ parentId: parent._id })
                      .initialValueTemplates([
                        S.initialValueTemplateItem('category-child', {
                          parentId: parent._id,
                        }),
                      ]),
                })
              ),
            ])
        )
      )
    )
}
