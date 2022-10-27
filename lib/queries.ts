import { groq } from 'next-sanity'

const postFields = `
  _id,
  _updatedAt,
  title,
  publishedAt,
  "mainImage": {
    "caption": mainImage.caption,
    "attribution": mainImage.attribution,
    "crop": mainImage.crop,
    "hotspot": mainImage.hotspot,
    "asset": mainImage.asset->{
      _id,
      _type,
      url,
      metadata
    }
  },
  category,
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, bio, role, socialMedia, "image": { "asset": image.asset->{_id, _type, metadata, url}}},
  excerpt,
  body[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" => {
        "slug": @.reference->slug
      }
    }
  },
  featuredArticle,
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 180 ),
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
  category,
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 180 ),
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
  bio,
  socialMedia,
`

const legalFields = `
  _id,
  _updatedAt,
  title,
  slug,
  body
`

export const getCategories = groq`*[_type == "category" && count(*[_type == 'post' && references(^._id)]) > 0]{
  _id,
  title,
  _updatedAt,
  "slug": slug.current,
  description
}`

export const getSubCategories = groq`*[_type == "category" && defined(parent->slug.current) && slug.current == parent->slug.current + "/" + $slug && count(*[_type == 'post' && references(^._id)]) > 0][0]{
  _id,
  title,
  _updatedAt,
  "parentSlug": parent->slug.current,
  "parentTitle": parent->title,
  "slug": slug.current,
  description,
  "posts": *[_type == 'post' && references(^._id)] | order(publishedAt desc) {
    ${litePostFields}
  }
}`

export const subCategorySlugs = groq`*[_type == "category" && defined(parent->slug.current) && count(*[_type == 'post' && references(^._id)]) > 0][].slug.current`

export const postQuery = groq`
*[_type == "post" && slug.current == $slug]{
  "currentPost": {
    ${postFields}
  },
  "morePosts": *[_type == "post" && slug.current != $slug] | order(publishedAt desc, _updatedAt desc)[0...3] {
    ${postFields}
  }
}|order(publishedAt)[0]
`

export const postSlugsQuery = `
*[_type == "post" && defined(slug.current)][].slug.current
`

export const authorSlugsQuery = groq`
*[_type == 'author' && defined(slug.current)][].slug.current
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
    socialMedia
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
  "author": author->{name, 'slug': slug.current, image, bio},
}
`

export const getAllPostsForSitemap = groq`
*[_type == 'post' && defined(slug.current)]{
  _updatedAt,
  "slug": slug.current,
}
`

export const getAllPostsForNewsSitemap = groq`
*[_type == 'post' && defined(slug.current)]{
  publishedAt,
  title,
  category,
  "slug": slug.current,
}
`

export const getAllAuthorsForSitemap = groq`
*[_type == 'author' && defined(slug.current)]{
  _updatedAt,
  "slug": slug.current,
}
`

export const allPostsForRssFeed = groq`
*[_type == 'post']{
  _id,
  'slug': slug.current,
  publishedAt,
  _updatedAt,
  title,
  excerpt,
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
  "author": author->{name, 'slug': slug.current},
  body[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" => {
        "slug": @.reference->slug
      }
    }
  },
}
`

export const FCS_COLLECTION_FRAGMENT = /* groq */ `
*[
  _type == "post" && category == 'FCS' &&
  defined(slug.current)
]
`

export const fetchTotalPosts = groq`
  count(*[
    _type == "post" && category == $category &&
    defined(slug.current)
  ]._id)
`

export const fcsPostsQuery = groq`
  {
    "posts": *[_type == "post" && category == 'FCS' ] | order(publishedAt desc)[(($pageIndex - 1) * 10)...$pageIndex * 10]{
      ${litePostFields}
    },
    "totalPosts": count(${FCS_COLLECTION_FRAGMENT}._id)
  }
`

export const allFBSPosts = groq`
*[_type == "post" && category == 'FBS' ] | order(publishedAt desc, _updatedAt desc){
    ${litePostFields}
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
*[_type == 'post' && title match "*" + $searchTerm + "*"] | order(publishedAt desc, _updatedAt desc)[0..10]{
  ${litePostFields}
}
`
