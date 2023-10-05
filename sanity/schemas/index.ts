import author from './documents/author'
import post from './documents/post'
import legal from './documents/legal'
import player from './documents/player'
import school from './documents/school'
import { redirect } from './documents/redirect'
import transferPortal from './documents/transferPortal'
import conference from './documents/conference'
import division from './documents/division'
import tag from './documents/tag'

import mainImage from './objects/mainImage'
import blockContent from './objects/blockContent'
import position from './objects/playerPosition'
import height from './objects/height'
import twitter from './objects/twitter'
import socialMedia from './objects/socialMedia'
import classYear from './objects/classYear'
import top25Table from './objects/top25Table'

export const schemaTypes = [
  author,
  post,
  legal,
  player,
  school,
  redirect,
  transferPortal,
  conference,
  division,
  tag,
  mainImage,
  blockContent,
  position,
  height,
  twitter,
  socialMedia,
  classYear,
  top25Table,
]

export const PREVIEWABLE_DOCUMENT_TYPES: string[] = [post.name, author.name]

export const PREVIEWABLE_DOCUMENT_TYPES_REQUIRING_SLUGS = [
  post.name,
  author.name,
] satisfies typeof PREVIEWABLE_DOCUMENT_TYPES
