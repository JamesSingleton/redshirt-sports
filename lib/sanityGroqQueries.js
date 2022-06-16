import { groq } from 'next-sanity'

const postFields = `
  _id,
  _updatedAt,
  title,
  publishedAt,
  mainImage,
  "categories": categories[]->title,
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, image, bio, twitterHandle},
  excerpt,
  body,
  featuredArticle,
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 170 )
`

const authorFields = `
  _id,
  _updatedAt,
  name,
  'slug': slug.current,
  role,
  image,
  backgroundImage,
  bio,
  twitterURL,
  twitterHandle,
`

const legalFields = `
  _id,
  _updatedAt,
  title,
  slug,
  body
`

export const postQuery = groq`
  {
    'post': *[_type == "post" && slug.current == $slug] | order(_updatedAt desc)[0] {
      ${postFields},
      "otherAuthors": *[_type == "author" && _id != ^.author._ref]{
        _id,
        name,
        'slug': slug.current,
        role,
        image
      }
    },
    "morePosts": *[_type == "post" && slug.current != $slug] | order(publishedAt desc, _updatedAt desc)[0...4] {
      _id,
      title,
      publishedAt,
      mainImage,
      categories,
      'slug': slug.current,
      "author": author->{name, 'slug': slug.current, image}
    },
    "topPosts": *[_type == "post" && slug.current in $topPages] {
      _id,
      title,
      publishedAt,
      mainImage,
      categories,
      'slug': slug.current,
      "author": author->{name, 'slug': slug.current, image}
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

export const authorAndTheirPostsBySlug = groq`
  *[_type== 'author' && slug.current == $slug][0] {
    ${authorFields}
    "posts": *[_type == "post" && references(^._id) ] | order(publishedAt desc, _updatedAt desc)[0...4]{
      ${postFields}
    }
  }
`

export const allAuthors = groq`
  *[_type == 'author'] | order(_createdAt asc){
    name,
    _updatedAt,
    'slug': slug.current,
    role,
    image,
  }
`

export const allPosts = groq`
*[_type == 'post']{
  ${postFields}
}
`

export const allFCSPosts = groq`
*[_type == "post" && 'FCS' in categories[]->title ] | order(publishedAt desc, _updatedAt desc){
  _id,
  publishedAt,
  title,
  mainImage,
  "categories": categories[]->title,
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, image, bio, twitterHandle},
  excerpt,
  }
`

export const allFBSPosts = groq`
*[_type == "post" && 'FBS' in categories[]->title ] | order(publishedAt desc, _updatedAt desc){
    ${postFields}
  }
`

export const homePageQuery = groq`
  {
    'heroPosts': *[_type == "post" && featuredArticle != true] | order(publishedAt desc)[0..2] {
      _id,
      title,
      mainImage,
      "categories": categories[]->title,
      "slug": slug.current,
    },
    "featuredArticle": *[_type == "post" && featuredArticle == true ][0]{
      _id,
      title,
      mainImage,
      "categories": categories[]->title,
      "slug": slug.current,
      featuredArticle,
    },
    "latestPosts": *[_type == "post"] | order(publishedAt desc, _updatedAt desc)[4..9] {
      _id,
      title,
      publishedAt,
      mainImage,
      "categories": categories[]->title,
      "slug": slug.current,
      "author": author->{name, 'slug': slug.current, image},
      excerpt,
    }
  }
`

export const getAdvertisingPage = `
*[_type == "legal" && slug.current == "advertising"][0] {
  ${legalFields}
}
`

export const getPrivacyPolicyPage = `
*[_type == "legal" && slug.current == "privacy-policy"][0] {
  ${legalFields}
}
`
