import { groq } from 'next-sanity'

const postFields = `
  _id,
  _updatedAt,
  title,
  publishedAt,
  "mainImage": {
    "caption": mainImage.caption,
    "attribution": mainImage.attribution,
    "asset": mainImage.asset->{ 
      _id,
      _ref,
      _type,
      metadata,
      url
     }
  },
  "categories": categories[]->title,
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, bio, role, twitterHandle, twitterURL, "image": { "asset": image.asset->{_id, _type, metadata, url}}},
  excerpt,
  body,
  featuredArticle,
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 170 ),
  "wordCount": length(pt::text(body))
`

const litePostFields = `
  _id,
  title,
  publishedAt,
  "mainImage": {
    "caption": mainImage.caption,
    "asset": mainImage.asset->{ 
      _id,
      _type,
      metadata,
      url
      }
  },
  "categories": categories[]->title,
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 170 ),
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, "image": { "asset": image.asset->{_id, _type, metadata, url}}},
  excerpt,
`

const authorFields = `
  _id,
  _updatedAt,
  name,
  'slug': slug.current,
  role,
  "image": {
    "asset": image.asset->{ 
      _id,
      _type,
      metadata,
      url
      }
  },
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
*[_type == "post" && slug.current == $slug]{
  "currentPost": {
    ${postFields}
  },
  "previousPost": *[_type == "post" && ^.publishedAt > publishedAt]|order(publishedAt desc)[0]{title,"slug": slug.current},
  "nextPost": *[_type == "post" && ^.publishedAt < publishedAt]|order(publishedAt asc)[0]{title,"slug": slug.current},
  "morePosts": *[_type == "post" && slug.current != $slug] | order(publishedAt desc, _updatedAt desc)[0...3] {
    ${postFields}
  }
}|order(publishedAt)[0]
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
    _id,
    _updatedAt,
    name,
    'slug': slug.current,
    role,
    "image": {
      "asset": image.asset->{ 
        _id,
        _type,
        metadata,
        url
        }
    },
    twitterURL
  }
`

export const allPosts = groq`
*[_type == 'post']{
  _id,
  'slug': slug.current,
  publishedAt,
  _updatedAt,
  title,
  "mainImage": {
    "caption": mainImage.caption,
    "attribution": mainImage.attribution,
    "asset": mainImage.asset->{ 
      _id,
      _type,
      metadata,
      url
     }
  },
  "author": author->{name, 'slug': slug.current, image, bio, twitterHandle},
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

const ITEMS_PER_PAGE = 10
const slice = `[($pageIndex * ${ITEMS_PER_PAGE})...($pageIndex + 1) * ${ITEMS_PER_PAGE}]`
const sliceWithParam = `[($pageIndex * 10)...($pageIndex + 1) * 10]`

export const fcsPostsQuery = groq`
  {
    "posts": *[_type == "post" && 'FCS' in categories[]->title ] | order(publishedAt desc, _updatedAt desc){
      ${litePostFields}
    },
    "pagination": {
      "totalPages": round(count(${allFCSPosts}._id) / ${ITEMS_PER_PAGE}),
      "currentPage": $pageIndex + 1
    }
  }
`

export const totalFCSPosts = groq`count(*[_type == "post" && 'FCS' in categories[]->title ])`

export const allFBSPosts = groq`
*[_type == "post" && 'FBS' in categories[]->title ] | order(publishedAt desc, _updatedAt desc){
    ${postFields}
  }
`

export const homePageQuery = groq`
  {
    'mainArticle': *[_type == "post" && featuredArticle != true] | order(publishedAt desc)[0] {
      ${litePostFields}
    },
    "recentArticles": *[_type == "post" && featuredArticle != true] | order(publishedAt desc, _updatedAt desc)[1..4] {
      ${litePostFields}
    },
    "otherArticles": *[_type == "post" && featuredArticle != true] | order(publishedAt desc, _updatedAt desc)[5..10] {
      ${litePostFields}
    },
    "featuredArticles": *[_type == "post" && featuredArticle == true] | order(publishedAt desc, _updatedAt desc)[0..3] {
      ${litePostFields}
    },
    "mostReadArticles": *[_type == "post" && featuredArticle != true && slug.current in $topArticles] | order(publishedAt desc, _updatedAt desc)[0..4] {
      ${litePostFields}
    }
  }
`

export const recentArticlesQuery = groq`
*[_type == "post" && featuredArticle != true] | order(publishedAt desc, _updatedAt desc)[0..3] {
  ${litePostFields}
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

export const searchQuery = groq`
*[_type == 'post' && title match $searchTerm] | order(publishedAt desc, _updatedAt desc){
  ${litePostFields}
}
`
