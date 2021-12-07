import { groq } from 'next-sanity'

const postFields = `
  _id,
  _updatedAt,
  title,
  publishedAt,
  mainImage,
  "categories": categories[]->title,
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, image, bio},
  excerpt,
  body
`

const authorFields = `
  _id,
  name,
  'slug': slug.current,
  role,
  image,
  backgroundImage,
  bio,
  twitterURL,
`

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

export const authorSlugsQuery = groq`
*[_type == 'author' && defined(slug.current)][].slug.current
`

export const authorBySlugQuery = groq`
  *[_type == 'author' && slug.current == $slug][0] {
    ${authorFields}
  }
`

export const postsByAuthor = groq`
  *[_type== 'author' && slug.current == $slug][0] {
    ${authorFields}
    "posts": *[_type == "post" && author._ref in *[_type=="author" && name == name ]._id ][0..2]{
      ${postFields}
    }
  }
`

export const allAuthors = groq`
  *[_type == 'author']{
    ${authorFields}
  }
`

export const allFCSPosts = groq`
*[_type == "post" && 'FCS' in categories[]->title ] | order(publishedAt desc, _updatedAt desc){
    ${postFields}
  }
`

export const allFBSPosts = groq`
*[_type == "post" && 'FBS' in categories[]->title ] | order(publishedAt desc, _updatedAt desc){
    ${postFields}
  }
`

export const homePageQuery = groq`
  {
    'heroPost': *[_type == "post"] | order(publishedAt desc)[0] {
      ${postFields}
    },
    "morePosts": *[_type == "post"] | order(publishedAt desc, _updatedAt desc)[1...4] {
      ${postFields}
    },
    "featuredArticles": *[_type == "post" && 'Featured' in categories[]->title ]{
      ${postFields}
    }
  }
`
