import { groq } from 'next-sanity'

const postFields = `
  _id,
  _updatedAt,
  title,
  publishedAt,
  mainImage,
  category->{title, description},
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, image, bio},
`

export const indexQuery = `
*[_type == "post"] | order(publishedAt desc, _updatedAt desc) {
  ${postFields}
}`

export const postQuery = groq`
  {
    'post': *[_type == "post" && slug.current == $slug] | order(_updatedAt desc)[0] {
      content,
      ${postFields}
    },
    "morePosts": *[_type == "post" && slug.current != $slug] | order(publishedAt desc, _updatedAt desc)[0...2] {
      content,
      ${postFields}
    }
  }
`

export const postSlugsQuery = `
*[_type == "post" && defined(slug.current)][].slug.current
`

export const postBySlugQuery = `
*[_type == "post" && slug.current == $slug][0] {
  ${postFields}
}
`
