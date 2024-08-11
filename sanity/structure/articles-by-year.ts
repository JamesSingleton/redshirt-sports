import { DocumentsIcon } from '@sanity/icons'
import { apiVersion } from '@/lib/sanity.api'
import { type StructureBuilder } from 'sanity/structure'

export const articlesByYear = (S: StructureBuilder) =>
  S.listItem()
    .title('Articles by Year')
    .icon(DocumentsIcon)
    .child(async () => {
      const posts = await S.context
        .getClient({ apiVersion })
        .fetch('* [_type == "post" && defined(publishedAt)] {_id, _type, publishedAt}', {
          type: 'post',
        })
      const years: { [year: string]: string[] } = {}
      const docs = posts.map((doc: any) => ({
        ...doc,
        year: new Date(doc.publishedAt).getFullYear(),
      }))
      docs.forEach((d: any) => {
        if (!years[d.year]) {
          years[d.year] = []
        }
        years[d.year].push(d._id)
      })
      return S.list()
        .title('Years')
        .items(
          Object.entries(years).map(([year_1, ids]) =>
            S.listItem()
              .title(year_1)
              .id(year_1)
              .child(() =>
                S.documentList()
                  .id(`year-${year_1}`)
                  .title(year_1)
                  .filter(`_id in [${ids.map((id_2) => `"${id_2}"`).join(',')}]`)
                  .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
                  .canHandleIntent(S.documentTypeList('post').getCanHandleIntent()),
              ),
          ),
        )
    })
